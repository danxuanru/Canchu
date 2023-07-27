/* eslint-disable semi */
/* eslint-disable camelcase */
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const { authenticateToken } = require('../authorization.js');
const { updateFriendCount } = require('../Model/friendModel.js');
const { addNewEvent } = require('../Model/eventModel.js');
const { getUserSearchObj } = require('../Model/searchModel.js');
const { clearCache } = require('../cache.js');

const router = express.Router();

async function requestFriend (req, res) {
  const inviteeId = +req.params.user_id; // get parameters: use '+' replace parseInt

  // header authorization
  const header = req.headers.authorization;
  const token = header.split(' ')[1];
  const user = jwt.verify(token, secretKey);
  const userId = user.id;
  if (userId === inviteeId) { return res.status(403).json({ error: 'Can\'t Friends Yourself!' }); }

  try {
    const searchQuery = 'SELECT * FROM friendship WHERE user1_id = ? AND user2_id = ?';
    const results = await pool.query(searchQuery, [userId, inviteeId]);
    if (results[0].length > 0) {
      // console.log(results[0]);
      return res.status(400).json({ error: 'Already Request!' });
    }

    // add to friendship table & get friendship ID
    const query = 'INSERT INTO friendship (user1_id, user2_id, status) VALUE (?, ?, ?)';
    const friendship = await pool.query(query, [userId, inviteeId, 'pending']);

    const friendship_id = friendship[0].insertId;

    // add event (select user profile + insert into events)
    await addNewEvent('friend_request', userId, inviteeId);

    // update - clear cache
    await clearCache(userId);

    const friendshipData = {
      id: friendship_id
      // status: 'pending'
    }
    return res.json({ data: { friendship: friendshipData } });
  } catch (error) {
    console.error('SELECT error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

async function getPendingFriends (req, res) {
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const userId = user.id;

  console.log(userId + ' get pending friends');

  try {
    // const sql = `SELECT U.id, U.name, U.picture, F.id as friendship_id FROM users as U JOIN friendship as F ON U.id = F.user1_id
    //                 WHERE F.user2_id = ? AND F.status = ?`;
    // // const sql = 'SELECT id, name, picture FROM users JOIN friendship ON users.id = friendship.user1_id WHERE friendship.user2_id = ? AND friendship.status = ?'
    // // const query = 'SELECT * FROM friendship WHERE user1_id = ? AND status = ?';
    // const results = await pool.query(sql, [user.id, 'pending'])

    // const users = []
    // for (let i = 0; i < results[0].length; i++) {
    //   const { id, name, picture, friendship_id } = results[0][i]
    //   const search_obj = {
    //     id,
    //     name,
    //     picture,
    //     friendship: { id: friendship_id, status: 'pending' }
    //   }
    //   users.push(search_obj)
    //   console.log(search_obj)
    // }

    const users = await getUserSearchObj(userId, 'pending');

    return res.json({ data: { users } });
  } catch (err) {
    console.error('Error: ', err);
    return res.status(500).json({ error: 'Server Error' });
  }
}

async function agreeFriend (req, res) {
  const friendship_id = req.params.friendship_id;
  const token = res.locals.token;
  // const token = req.user;
  // 用這種存法 回傳的是object 即使使用JSON.stringify()也後會有error

  // status = pending & check user.id is user2_id
  const select = 'SELECT user1_id, user2_id, status FROM friendship WHERE id = ?';
  const results = await pool.query(select, [friendship_id]);

  // console.log(results);
  const { user1_id, user2_id, status } = results[0][0];

  // add a restrict , if friendship_id out of the range

  if (status === 'accepted') { return res.status(400).json({ error: 'You Have Agreed This Request!' }); }

  const user = jwt.verify(token, secretKey)
  const userId = user.id;
  if (userId !== user2_id) { return res.status(400).json({ error: 'You Can\'t Agree This Request!' }); }

  console.log(userId + ' agree friendship: ' + friendship_id);

  // update friendship.status = pending
  const update = 'UPDATE friendship SET status = ? WHERE id = ?';
  await pool.query(update, ['friend', friendship_id]);
  await updateFriendCount(user1_id, user2_id, 'agree');

  // update - clear cache
  await clearCache(userId);

  // add new event
  await addNewEvent('agree_request', user2_id, user1_id);

  // response
  res.json({ data: { friendship: { id: friendship_id } } });
}

async function deleteFriend (req, res) {
  const friendship_id = req.params.friendship_id;
  const token = res.locals.token;

  // get friendship from friendship_id
  const select = 'SELECT user1_id, user2_id FROM friendship WHERE id = ?';
  const results = await pool.query(select, [friendship_id]);

  // console.log(results[0][0]);
  const { user1_id, user2_id } = results[0][0];

  const user = jwt.verify(token, secretKey);
  const userId = user.id;

  // check user is in friendship
  if (userId !== user2_id && userId !== user1_id) { return res.status(400).json({ error: 'You Can\'t Delete This Request!' }); }

  console.log(userId + ' delete friendship: ' + friendship_id);

  // update friendship.status = pending
  const deleteFriendship = 'DELETE from friendship WHERE id = ?';
  await pool.query(deleteFriendship, [friendship_id]);
  await updateFriendCount(user1_id, user2_id, 'delete');

  // update - clear cache
  await clearCache(userId);

  // add new event
  const user_id = userId === user1_id ? user1_id : user2_id;
  const receiver_id = user_id === user1_id ? user2_id : user1_id;
  await addNewEvent('delete_friend', user_id, receiver_id);

  res.json({ data: { friendship: { id: friendship_id } } });
}

async function getFriends (req, res) {
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const userId = user.id;

  console.log(userId + ' get friends');

  // get friend id
  // const friendId = getFriendsId(userId);
  // get array of user search obj
  const users = await getUserSearchObj(userId, 'friend');

  return res.json({ data: { users } });
}

router.post('/:user_id/request', authenticateToken, requestFriend);
router.get('/pending', authenticateToken, getPendingFriends);
router.post('/:friendship_id/agree', authenticateToken, agreeFriend);
router.delete('/:friendship_id', authenticateToken, deleteFriend);
router.get('/', authenticateToken, getFriends);

module.exports = router;
