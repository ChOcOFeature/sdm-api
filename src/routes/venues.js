const express = require('express');
const venueController = require('../controllers/venueController');

const router = express.Router();

router.get('/:id/concerts', venueController.getVenueConcerts);
router.get('/:id', venueController.getVenueById);

module.exports = router;
