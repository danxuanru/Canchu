/* eslint-disable camelcase */
/* eslint-disable semi */
require('dotenv').config();
const express = require('express');
const pool = require('../database.js');

const app = express();
app.use(express.json());

async function getPost (params, cursor, limit) {
  // let id_list = [];
  // id_list.push(await getFriendsId(user_id));
  // const query = `SELECT P.* FROM posts as P INNER JOIN users as U on P.user_id = U.user_id
  //                 WHERE P.user_id in (?) ORDER BY P.id ASC LIMIT ?`

  const query = `SELECT P.*, U.name, U.picture FROM posts AS P LEFT JOIN users AS U ON P.user_id = U.id
                    WHERE P.user_id in (?) AND P.id > ? ORDER BY P.id ASC LIMIT ?`;
  const results = await pool.query(query, [params, cursor, limit]);
  // get users.name & users.picture use getUserData() ?????
  // console.log('getPost: ' + results[0]);
  return results[0];
}

async function getLikeOrNot (post_id, user_id) {
  try {
    const like = await pool.query('SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?', [user_id, post_id]);
    // console.log('like: ' + JSON.stringify(like[0]));
    return like[0].length > 0;
  } catch (error) {
    console.error('SELECT error: ', error);
    return false;
  }
}

module.exports = {
  getPost,
  getLikeOrNot
}
