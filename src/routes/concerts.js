const express = require('express');
const concertController = require('../controllers/concertController');

const router = express.Router();

router.get('/', concertController.listConcerts);
router.get('/:id', concertController.getConcertById);

module.exports = router;
