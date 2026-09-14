const groupService = require('../services/groupService');

async function getGroupById(req, res, next) {
  try {
    const group = await groupService.getGroupById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    return res.json({ data: group });
  } catch (error) {
    return next(error);
  }
}

async function getGroupConcerts(req, res, next) {
  try {
    const { includePast = 'false', page = '1', limit = '20' } = req.query;

    const response = await groupService.getGroupConcerts(req.params.id, {
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
  getGroupById,
  getGroupConcerts,
};
