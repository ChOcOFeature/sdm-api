const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeJsonValue(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeJsonValue(item)])
    );
  }

  return value;
}

function mapConcertToApiShape(concert) {
  if (!concert) {
    return null;
  }

  const mapped = {
    id: Number(concert.NumConcert ?? concert.id ?? 0),
    dateTime: concert.DateHeureConcert ? new Date(concert.DateHeureConcert).toISOString() : null,
    countryId: Number(concert.NumPaysConcert ?? 0),
    departmentCode: concert.NumDepartementConcert ?? null,
    city: concert.VilleConcert ?? null,
    venueName: concert.SalleConcert ?? null,
    venueAddress: concert.AdresseConcert ?? null,
    venueId: concert.id_salle !== undefined && concert.id_salle !== null ? Number(concert.id_salle) : null,
    createdAt: concert.created_at ? new Date(concert.created_at).toISOString() : null,
    updatedAt: concert.updated_at ? new Date(concert.updated_at).toISOString() : null,
  };

  return normalizeJsonValue(mapped);
}

function mapGroupToApiShape(group) {
  if (!group) {
    return null;
  }

  const mapped = {
    id: Number(group.NumGroupe ?? group.id ?? 0),
    name: group.NomGroupe ?? null,
    officialWebsite: group.WebOfficielGroupe ?? null,
    style: group.style ?? null,
    twitter: group.twitter ?? null,
    positionOnPoster: group.PositionGroupeSurAffiche !== undefined && group.PositionGroupeSurAffiche !== null
      ? Number(group.PositionGroupeSurAffiche)
      : null,
    musicalStyle: group.StyleMusicalGroupe ?? null,
  };

  return normalizeJsonValue(mapped);
}

async function getGroupsForConcertIds(concertIds = []) {
  if (!concertIds.length) {
    return {};
  }

  const placeholders = concertIds.map(() => '?').join(',');
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT
        l.NumConcert,
        g.NumGroupe,
        g.NomGroupe,
        g.WebOfficielGroupe,
        g.style,
        g.twitter,
        l.PositionGroupeSurAffiche,
        l.StyleMusicalGroupe
      FROM liaisonconcertsgroupes l
      INNER JOIN groupes g ON g.NumGroupe = l.NumGroupe
      WHERE l.NumConcert IN (${placeholders})
      ORDER BY l.PositionGroupeSurAffiche ASC, g.NomGroupe ASC
    `,
    ...concertIds
  );

  const groupsByConcert = {};

  for (const row of rows) {
    const concertId = Number(row.NumConcert);
    const group = mapGroupToApiShape(row);

    if (!groupsByConcert[concertId]) {
      groupsByConcert[concertId] = [];
    }

    groupsByConcert[concertId].push(group);
  }

  return groupsByConcert;
}

async function attachGroupsToConcerts(concerts = []) {
  if (!concerts.length) {
    return concerts;
  }

  const concertIds = [...new Set(concerts.map((concert) => Number(concert.NumConcert)))];
  const groupsByConcert = await getGroupsForConcertIds(concertIds);

  return concerts.map((concert) => {
    const concertId = Number(concert.NumConcert);
    const groups = groupsByConcert[concertId] || [];
    const mappedConcert = mapConcertToApiShape(concert);

    return {
      ...mappedConcert,
      groups,
    };
  });
}

function buildWhereClause({ groupId, department, city, from, to, includePast }) {
  const conditions = [];
  const params = [];

  if (groupId) {
    conditions.push('c.NumConcert IN (SELECT NumConcert FROM liaisonconcertsgroupes WHERE NumGroupe = ?)');
    params.push(Number(groupId));
  }

  if (department) {
    conditions.push('c.NumDepartementConcert = ?');
    params.push(String(department));
  }

  if (city) {
    conditions.push('LOWER(c.VilleConcert) = LOWER(?)');
    params.push(String(city));
  }

  if (from) {
    conditions.push('c.DateHeureConcert >= ?');
    params.push(new Date(from));
  }

  if (to) {
    conditions.push('c.DateHeureConcert <= ?');
    params.push(new Date(to));
  }

  if (!includePast) {
    conditions.push('c.DateHeureConcert >= NOW()');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return { whereClause, params };
}

async function countConcerts(filters = {}) {
  const { ...query } = filters;
  const { whereClause, params } = buildWhereClause(query);

  const countQuery = `
    SELECT COUNT(*) AS count_total
    FROM concerts c
    ${whereClause}
  `;

  const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
  return Number(countResult[0]?.count_total ?? 0);
}

async function getConcerts(filters = {}) {
  const { page = 1, limit = 20, ...query } = filters;
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const offset = (safePage - 1) * safeLimit;

  const { whereClause, params } = buildWhereClause(query);

  const queryText = `
    SELECT c.*
    FROM concerts c
    ${whereClause}
    ORDER BY c.DateHeureConcert ASC
    LIMIT ? OFFSET ?
  `;

  const [results, total] = await Promise.all([
    prisma.$queryRawUnsafe(queryText, ...params, safeLimit, offset),
    countConcerts(query),
  ]);

  return {
    data: await attachGroupsToConcerts(results),
    count_total: Number(total ?? 0),
  };
}

async function getConcertById(id) {
  const results = await prisma.$queryRawUnsafe(
    'SELECT * FROM concerts WHERE NumConcert = ? LIMIT 1',
    Number(id)
  );

  if (!results[0]) {
    return null;
  }

  const concert = await attachGroupsToConcerts([results[0]]);
  return concert[0];
}

async function getConcertsByVenueId(venueId, filters = {}) {
  const { page = 1, limit = 20, includePast = false } = filters;
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const offset = (safePage - 1) * safeLimit;

  const clauses = ['c.id_salle = ?'];
  const params = [Number(venueId)];

  if (!includePast) {
    clauses.push('c.DateHeureConcert >= NOW()');
  }

  const queryText = `
    SELECT c.*
    FROM concerts c
    WHERE ${clauses.join(' AND ')}
    ORDER BY c.DateHeureConcert ASC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS count_total
    FROM concerts c
    WHERE ${clauses.join(' AND ')}
  `;

  const [results, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(queryText, ...params, safeLimit, offset),
    prisma.$queryRawUnsafe(countQuery, ...params),
  ]);

  return {
    data: await attachGroupsToConcerts(results),
    count_total: Number(countResult[0]?.count_total ?? 0),
  };
}

async function getConcertsByGroupId(groupId, filters = {}) {
  const { page = 1, limit = 20, includePast = false } = filters;
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const offset = (safePage - 1) * safeLimit;

  const clauses = ['l.NumGroupe = ?'];
  const params = [Number(groupId)];

  if (!includePast) {
    clauses.push('c.DateHeureConcert >= NOW()');
  }

  const queryText = `
    SELECT c.*
    FROM liaisonconcertsgroupes l
    INNER JOIN concerts c ON c.NumConcert = l.NumConcert
    WHERE ${clauses.join(' AND ')}
    ORDER BY c.DateHeureConcert ASC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS count_total
    FROM liaisonconcertsgroupes l
    INNER JOIN concerts c ON c.NumConcert = l.NumConcert
    WHERE ${clauses.join(' AND ')}
  `;

  const [results, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(queryText, ...params, safeLimit, offset),
    prisma.$queryRawUnsafe(countQuery, ...params),
  ]);

  return {
    data: await attachGroupsToConcerts(results),
    count_total: Number(countResult[0]?.count_total ?? 0),
  };
}

module.exports = {
  getConcerts,
  getConcertById,
  getConcertsByVenueId,
  getConcertsByGroupId,
  attachGroupsToConcerts,
};
