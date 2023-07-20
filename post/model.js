/* eslint-disable no-undef */
/* eslint-disable linebreak-style */
/* eslint-disable import/extensions */
/* eslint-disable consistent-return */
/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
require('dotenv').config();
const express = require('express');
const pool = require('./database.js');

const app = express();
app.use(express.json());

function getDateFormat() {
  const date = new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate());
  const hours = String(date.getHours());
  const minutes = String(date.getMinutes());
  const seconds = String(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function addNewEvent(type, user_id, receiver_id) {
  try {
    // add event (select user profile + insert into events)
    const profile = 'SELECT name, picture FROM users WHERE id = ?';
    const user = await pool.query(profile, [user_id]);
    const image = user[0][0].picture;
    const date = getDateFormat();

    let summary = `${user[0][0].name}邀請你成為好友`;
    if (type === 'agree_request') { summary = `${user[0][0].name}同意你的好友邀請`; } else if (type === 'delete_friend') { summary = `${user[0][0].name}已將你從好友名單中刪除`; }

    const insertEvent = 'INSERT INTO events (type, is_read, image, summary, user_id, created_at) VALUE (?,?,?,?,?,?)';
    await pool.query(insertEvent, [type, false, image, summary, receiver_id, date]);
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

// async function addReadEvent(event_id) {

//     try {
//         const select = `SELECT * FROM events WHERE id = ?`;
//         const results = await pool.query(select, [event_id]);
//         const data = results[0][0];
//         const Date = getDateFormat();

//         const insertEvent = `INSERT INTO events (type, is_read, image, summary, user_id, created_at) VALUE (?,?,?,?,?,?)`;
//         await pool.query(insertEvent, [data.type, true, data.image, data.summary, data.user_id, Date]);

//     } catch(error) {
//         console.error('Error: ', error);
//         return res.status(500).json({ error: 'Server Error'});
//     }
//     return;
// }

//--------------------------------------------------------------
async function getUserData(user_id, column_arr){

  const column_str = column_arr.join(', ');
  const query = `SELECT (?) FROM users WHERE id = ?`;
  try {
    const [results] = await pool.query(query, [column_str, user_id]);
    console.log(results);
    // const data_arr = results[0].map()
    return results[0];

  } catch(error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}


// -------------------------------------------------------------
async function getFriendship(user_id, friend_id) {
  const query = 'SELECT id, status FROM friendship WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)';
  const results = await pool.query(query, [user_id, friend_id, friend_id, user_id]);

  console.log(results[0]);

  if (results[0].length === 0) { return null; }

  // const friendship = {
  //     id: results[0][0].id,
  //     status: results[0][0].status
  // }
  const [{ id, status }] = results[0];
  console.log({ id, status });
  return { id, status };
}

async function getFriendsId(user_id){
  const query = `SELECT user1_id as id FROM friendship WHERE user2_id = ? AND status = 'accepted' UNION
                  SELECT user2_id as id FROM friendship WHERE user1_id = ? AND status = 'accepted'`;
  const results = await pool.query(query, [user_id, user_id]);
  console.log('friend id:'+ results);
  const friend_arr = results[0].map(result => result.id);
  console.log(typeof friend_arr);
  return friend_arr;
}

// ---------------------------------------------------------------
async function getPost (params, cursor, limit) {
  // let id_list = [];
  // id_list.push(await getFriendsId(user_id));
  // const query = `SELECT P.* FROM posts as P INNER JOIN users as U on P.user_id = U.user_id
  //                 WHERE P.user_id in (?) ORDER BY P.id ASC LIMIT ?`
  // const id_list = params.join(', '); // array to string
  const query = `SELECT P.*, U.name, U.picture FROM posts AS P LEFT JOIN users AS U ON P.user_id = U.id
                  WHERE p.user_id in (?) AND p.id > ? ORDER BY p.id ASC LIMIT ?`
  const results = await pool.query(query, [params, cursor, limit]);
  // get users.name & users.picture use getUserData() ?????
  console.log(results[0]);
  return results[0];
}

async function getLikeOrNot(post_id, user_id) {
  // EXISTS( SELECT 1 FROM likes WHERE L.post_id = P.id AND = L.user_id = ?) as is_liked
  const like = await pool.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user_id]);

  if (like[0].length === 1) { return true; }
  return false;
}


module.exports = {
  getDateFormat,
  addNewEvent,
  getUserData,
  getFriendship,
  getFriendsId,
  getPost,
  getLikeOrNot
};
