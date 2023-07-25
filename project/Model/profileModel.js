/* eslint-disable camelcase */
/* eslint-disable semi */
require('dotenv').config();
const express = require('express');
const pool = require('../database.js');
const { getFriendship } = require('./friendModel.js');

const app = express();
app.use(express.json());

async function getProfileData (visiterId, userId) {
  const query = 'SELECT id, name, picture, introduction, tags, friend_count FROM users WHERE id = ?';
  const results = await pool.query(query, [userId]);

  if (results[0].length === 0) { return { error: 'User not found' }; }

  const { id, name, picture, introduction, tags, friend_count } = results[0][0];

  // get friend_count
  // const friends = await getFriendsId(targetUserId);
  // console.log('friends:' + friends);
  // const friend_count = friends.length;
  // console.log('friend count: ' + friend_count);

  const friendship = await getFriendship(visiterId, userId);

  // response
  const user = {
    id,
    name,
    picture,
    friend_count,
    introduction,
    tags,
    friendship
  }
  return { data: { user } };
}

module.exports = { getProfileData };
