require('dotenv').config();
const express = require('express');
const pool = require('../database.js');

const app = express();
app.use(express.json());

async function getUserSearchObj (userId, type) {
  // improve: user search也能使用這個function
  let queryType = type;
  if (type === undefined) queryType = '__NO_FILTER__';
  else if (type === 'requested') queryType = 'pending';

  const requested = `SELECT U.id, U.name, U.picture, F.id as friendship_id,
                        CASE WHEN status = 'pending' THEN 'requested' ELSE status END AS status
                        FROM users as U JOIN friendship as F ON U.id = F.user2_id
                        WHERE F.user1_id = ? AND status in (?)`;
  const pending = `SELECT U.id, U.name, U.picture, F.id as friendship_id, status
                      FROM users as U JOIN friendship as F ON U.id = F.user1_id
                      WHERE F.user2_id = ? AND status in (?)`;
  let sql = requested;
  const params = [userId, queryType];
  if (type === 'pending') sql = pending;
  else {
    sql = requested + ' UNION ' + pending;
    params.push(userId, queryType);
  }
  // console.log('sql: ' + sql);
  // console.log('params: ' + params);
  const data = await pool.query(sql, params);

  // get userData
  // const userData = await getUserData(friendId, ['id', 'name', 'picture']);
  // console.log('userData: ' + userData);
  // const friendshipData = await getFriendship(userId, friendId, 'friend');

  const users = [];
  for (let i = 0; i < data[0].length; i++) {
    const { id, name, picture, friendship_id, status } = data[0][i];
    const obj = {
      id,
      name,
      picture,
      friendship: {
        id: friendship_id,
        status
      }
    }
    // console.log(obj);
    users.push(obj);
  }
  return users;
}

module.exports = { getUserSearchObj };
