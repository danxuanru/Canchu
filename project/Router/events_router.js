/* eslint-disable semi */
const express = require('express');
const { authenticateToken } = require('../utils/authorization');
const { getEvents, readEvent } = require('../Controllers/events');
const router = express.Router();

router.get('/', authenticateToken, getEvents);
router.post('/:event_id/read', authenticateToken, readEvent);

module.exports = router;
