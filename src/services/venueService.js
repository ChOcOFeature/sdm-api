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

function mapVenueToApiShape(venue) {
  if (!venue) {
    return null;
  }

  return normalizeJsonValue({
    id: Number(venue.salle_id ?? venue.id ?? 0),
    name: venue.salle ?? null,
    department: venue.departement ?? null,
    city: venue.ville ?? null,
    address: venue.adresse ?? null,
    postalCode: venue.code_postal ?? null,
    latitude: venue.latitude !== undefined && venue.latitude !== null ? Number(venue.latitude) : null,
    longitude: venue.longitude !== undefined && venue.longitude !== null ? Number(venue.longitude) : null,
    country: venue.pays ?? null,
    activity: venue.activity ?? null,
  });
}

async function getVenueById(id) {
  const results = await prisma.$queryRawUnsafe(
    'SELECT * FROM salles WHERE salle_id = ? LIMIT 1',
    Number(id)
  );

  const venue = results[0] || null;

  if (!venue) {
    return null;
  }

  return mapVenueToApiShape(venue);
}

async function getVenueConcerts(id, filters = {}) {
  const { includePast = false, page = 1, limit = 20 } = filters;
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const offset = (safePage - 1) * safeLimit;

  const clauses = ['c.id_salle = ?'];
  const params = [Number(id)];

  if (!includePast) {
    clauses.push('c.DateHeureConcert >= NOW()');
  }

  const query = `
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
  getVenueById,
  getVenueConcerts,
};
