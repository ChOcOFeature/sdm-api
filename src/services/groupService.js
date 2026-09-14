const { PrismaClient } = require('@prisma/client');
const { attachGroupsToConcerts } = require('./concertService');

const prisma = new PrismaClient();

function normalizeJsonValue(value) {
  if (typeof value === 'bigint') {
    return Number(value);
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

function mapGroupToApiShape(group) {
  if (!group) {
    return null;
  }

  return normalizeJsonValue({
    id: Number(group.NumGroupe ?? group.id ?? 0),
    name: group.NomGroupe ?? null,
    officialWebsite: group.WebOfficielGroupe ?? null,
    style: group.style ?? null,
    twitter: group.twitter ?? null,
  });
}

async function getGroupById(id) {
  const results = await prisma.$queryRawUnsafe(
    'SELECT * FROM groupes WHERE NumGroupe = ? LIMIT 1',
    Number(id)
  );

  const group = results[0] || null;

  if (!group) {
    return null;
  }

  return mapGroupToApiShape(group);
}

async function getGroupConcerts(id, filters = {}) {
  const { includePast = false, page = 1, limit = 20 } = filters;
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const offset = (safePage - 1) * safeLimit;

  const clauses = ['l.NumGroupe = ?'];
  const params = [Number(id)];

  if (!includePast) {
    clauses.push('c.DateHeureConcert >= NOW()');
  }

  const query = `
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

  const [concerts, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(query, ...params, safeLimit, offset),
    prisma.$queryRawUnsafe(countQuery, ...params),
  ]);

  return {
    data: await attachGroupsToConcerts(concerts),
    count_total: Number(countResult[0]?.count_total ?? 0),
  };
}

module.exports = {
  getGroupById,
  getGroupConcerts,
};
