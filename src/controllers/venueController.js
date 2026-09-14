const venueService = require('../services/venueService');

async function getVenueById(req, res, next) {
  try {
    const venue = await venueService.getVenueById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found.' });
    }

    return res.json({ data: venue });
  } catch (error) {
    return next(error);
  }
}

async function getVenueConcerts(req, res, next) {
  try {
    const { includePast = 'false', page = '1', limit = '20' } = req.query;

    const response = await venueService.getVenueConcerts(req.params.id, {
      includePast: includePast === 'true',
      page,
      limit,
    });

    res.json({
      data: response.data,
      count_total: response.count_total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getVenueById,
  getVenueConcerts,
};
