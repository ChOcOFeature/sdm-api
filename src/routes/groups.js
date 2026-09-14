const express = require('express');
const groupController = require('../controllers/groupController');

const router = express.Router();

router.get('/:id/concerts', groupController.getGroupConcerts);
router.get('/:id', groupController.getGroupById);

module.exports = router;
