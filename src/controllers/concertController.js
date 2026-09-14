const concertService = require('../services/concertService');

async function listConcerts(req, res, next) {
  try {
    const {
      groupId,
      department,
      city,
      from,
      to,
      includePast = 'false',
      page = '1',
      limit = '20',
    } = req.query;

    const response = await concertService.getConcerts({
      groupId,
      department,
      city,
      from,
      to,
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

async function getConcertById(req, res, next) {
  try {
    const concert = await concertService.getConcertById(req.params.id);

    if (!concert) {
      return res.status(404).json({ message: 'Concert not found.' });
    }

    return res.json({ data: concert });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listConcerts,
  getConcertById,
};
