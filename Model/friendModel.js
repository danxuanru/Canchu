/* eslint-disable camelcase */
/* eslint-disable semi */
require('dotenv').config();
const express = require('express');
const pool = require('../database');

const app = express();
app.use(express.json());

// 獲取兩者間的關係
async function getFriendship (user_id, friend_id, type) {
  // if (type === undefined) type = 'NULL';
  // console.log('type:' + type);
  const query = `SELECT id, CASE WHEN status = 'pending' THEN 'requested' ELSE status END AS status
                  FROM friendship WHERE user1_id = ? AND user2_id in (?) AND (status = ? OR ? IS NULL)
                  UNION 
                  SELECT id, status 
                  FROM friendship WHERE user1_id in (?) AND user2_id = ? AND (status = ? OR ? IS NULL)`;

  const value = [user_id, friend_id, type, type, friend_id, user_id, type, type];
  try {
    const results = await pool.query(query, value);
    // console.log('friendship: ' + results[0])
    if (results[0].length === 0) { return null; }
    const { id, status } = results[0][0];
    console.log('get friendship:' + { id, status });
    return { id, status };
  } catch (error) {
    console.error('SELECT error: ', error);
    throw new Error('Server Error');
  }
}

// 獲取所以朋友的id
async function getFriendsId (user_id) {
  const query = `SELECT user1_id as id FROM friendship WHERE user2_id = ? AND status = 'friend' UNION
                  SELECT user2_id as id FROM friendship WHERE user1_id = ? AND status = 'friend'`;
  const results = await pool.query(query, [user_id, user_id]);
  // console.log(`friend id:${results}`);
  const friend_arr = results[0].map((result) => result.id);
  console.log('get friend id: ' + friend_arr);
  return friend_arr;
}

// 獲取id的所有朋友 friendObj
async function getFriendshipObj (user_id) {
  const query = `SELECT user1_id as id, 
                  CASE WHEN status = 'pending' THEN 'requested' ELSE status END AS status 
                  FROM friendship WHERE user2_id = ? 
                  UNION
                  SELECT user2_id as id, status 
                  FROM friendship WHERE user1_id = ?`;
  const results = await pool.query(query, [user_id, user_id]);

  const friendship_obj = [];
  for (let i = 0; i < results[0].length; i++) {
    const { id, status } = results[0][i];
    const obj = {
      id,
      status
    }
    friendship_obj.push(obj);
  }
  console.log('get friendship obj: ' + friendship_obj);
  return friendship_obj;
}

async function updateFriendCount (userId, friendId, type) {
  // agree - frined_count ++
  // delete - friend_count --
  if (type === 'agree') {
    const query = 'UPDATE users SET friend_count = friend_count+1 WHERE id = ? OR id = ?';
    await pool.query(query, [userId, friendId]);
  } else if (type === 'delete') {
    const query = 'UPDATE users SET friend_count = friend_count-1 WHERE id = ? OR id = ?';
    await pool.query(query, [userId, friendId]);
  }
}

module.exports = {
  getFriendship,
  getFriendsId,
  getFriendshipObj,
  updateFriendCount
}
