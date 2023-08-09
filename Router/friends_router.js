/* eslint-disable semi */
const express = require('express');
const { authenticateToken } = require('../utils/authorization');
const { requestFriend, getPendingFriends, agreeFriend, deleteFriend, getFriends } = require('../Controllers/friends');
const router = express.Router();

router.post('/:user_id/request', authenticateToken, requestFriend);
router.get('/pending', authenticateToken, getPendingFriends);
router.post('/:friendship_id/agree', authenticateToken, agreeFriend);
router.delete('/:friendship_id', authenticateToken, deleteFriend);
router.get('/', authenticateToken, getFriends);

module.exports = router;
