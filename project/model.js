/* eslint-disable camelcase */
require('dotenv').config()
const express = require('express')
const pool = require('./database.js')

const app = express()
app.use(express.json())

function getDateFormat () {
  const date = new Date()
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1)
  const day = String(date.getDate())
  const hours = String(date.getHours())
  const minutes = String(date.getMinutes())
  const seconds = String(date.getSeconds())
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

async function addNewEvent (type, user_id, receiver_id) {
  try {
    // add event (select user profile + insert into events)
    const profile = 'SELECT name, picture FROM users WHERE id = ?'
    const user = await pool.query(profile, [user_id])
    const image = user[0][0].picture
    const date = getDateFormat()

    let summary = `${user[0][0].name}邀請你成為好友`
    if (type === 'agree_request') { summary = `${user[0][0].name}同意你的好友邀請` } else if (type === 'delete_friend') { summary = `${user[0][0].name}已將你從好友名單中刪除` }

    const insertEvent = 'INSERT INTO events (type, is_read, image, summary, user_id, created_at) VALUE (?,?,?,?,?,?)'
    await pool.query(insertEvent, [type, false, image, summary, receiver_id, date])
  } catch (error) {
    console.error('Error: ', error)
    return res.status(500).json({ error: 'Server Error' })
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

// user --------------------------------------------------------------
async function getUserData (user_id, column_arr) {
  const column_str = column_arr.join(', ')
  const query = 'SELECT (?) FROM users WHERE id in (?)'
  try {
    const [results] = await pool.query(query, [column_str, user_id])
    console.log(results[0]);
    // const data_arr = results[0].map()
    return results[0]
  } catch (error) {
    console.error('Error: ', error)
    return res.status(500).json({ error: 'Server Error' })
  }
}

// friend -------------------------------------------------------------
// 獲取兩者間的關係
async function getFriendship (user_id, friend_id, type) {
  if (type === undefined) type = '__NO_FILTER__';
  // console.log('type:' + type);
  const query = `SELECT id, CASE WHEN status = 'pending' THEN 'requested' ELSE status END AS status
                  FROM friendship WHERE user1_id = ? AND user2_id in (?) AND status in (?)
                  UNION
                  SELECT id, status 
                  FROM friendship WHERE user1_id in (?) AND user2_id = ? AND status in (?)`
  const results = await pool.query(query, [user_id, friend_id, type, friend_id, user_id, type])

  // console.log(results[0])

  if (results[0].length === 0) { return null }

  const { id, status } = results[0][0]
  console.log('friendship:' + { id, status })
  return { id, status }
}

// 獲取所以朋友的id
async function getFriendsId (user_id) {
  const query = `SELECT user1_id as id FROM friendship WHERE user2_id = ? AND status = 'friend' UNION
                  SELECT user2_id as id FROM friendship WHERE user1_id = ? AND status = 'friend'`
  const results = await pool.query(query, [user_id, user_id])
  console.log(`friend id:${results}`)
  const friend_arr = results[0].map((result) => result.id)
  console.log(friend_arr)
  return friend_arr
}

// 獲取id的所有朋友 friendObj
async function getFriendshipObj (user_id) {
  const query = `SELECT user1_id as id, 
                  CASE WHEN status = 'pending' THEN 'requested' ELSE status END AS status 
                  FROM friendship WHERE user2_id = ? 
                  UNION
                  SELECT user2_id as id, status 
                  FROM friendship WHERE user1_id = ?`
  const results = await pool.query(query, [user_id, user_id])

  const friendship_obj = []
  for (let i = 0; i < results[0].length; i++) {
    const { id, status } = results[0][i]
    const obj = {
      id,
      status
    }
    friendship_obj.push(obj)
  }
  return friendship_obj
}

async function updateFriendCount (userId, friendId, type) {
  // agree - frined_count ++
  // delete - friend_count --
  if (type === 'agree') {
    const query = 'UPDATE users SET friend_count = friend_count+1 WHERE id = ? OR id = ?'
    await pool.query(query, [userId, friendId])
  } else if (type === 'delete') {
    const query = 'UPDATE users SET friend_count = friend_count-1 WHERE id = ? OR id = ?'
    await pool.query(query, [userId, friendId])
  }
}

// post ---------------------------------------------------------------
async function getPost (params, cursor, limit) {
  // let id_list = [];
  // id_list.push(await getFriendsId(user_id));
  // const query = `SELECT P.* FROM posts as P INNER JOIN users as U on P.user_id = U.user_id
  //                 WHERE P.user_id in (?) ORDER BY P.id ASC LIMIT ?`

  const query = `SELECT P.*, U.name, U.picture FROM posts AS P LEFT JOIN users AS U ON P.user_id = U.id
                  WHERE P.user_id in (?) AND P.id > ? ORDER BY P.id ASC LIMIT ?`
  const results = await pool.query(query, [params, cursor, limit])
  // get users.name & users.picture use getUserData() ?????
  console.log(results[0])
  return results[0]
}

async function getLikeOrNot (post_id, user_id) {
  // EXISTS( SELECT 1 FROM likes WHERE L.post_id = P.id AND = L.user_id = ?) as is_liked
  const like = await pool.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user_id])
  console.log('like: ' + like);
  if (like[0].length === 1) { return true }
  return false
}


// search ------------------------------------------------------------
async function getUserSearchObj (userId, type) {
  // improve: user search也能使用這個function
  let queryType = type;
  if (type === undefined) queryType = '__NO_FILTER__';
  else if(type === 'requested') queryType = 'pending';

  const requested = `SELECT U.id, U.name, U.picture, F.id as friendship_id,
                      CASE WHEN status = 'pending' THEN 'requested' ELSE status END AS status
                      FROM users as U JOIN friendship as F ON U.id = F.user2_id
                      WHERE F.user1_id = ? AND status in (?)`;
  const pending = `SELECT U.id, U.name, U.picture, F.id as friendship_id, status
                    FROM users as U JOIN friendship as F ON U.id = F.user1_id
                    WHERE F.user2_id = ? AND status in (?)`;
  let sql = requested;
  let params = [userId, queryType];
  if (type === 'pending') sql = pending;
  else {
    sql = requested + ' UNION ' + pending;
    params.push(userId, queryType);
  }
  console.log('sql: ' + sql);
  console.log('params: ' + params);
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
    console.log(obj);
    users.push(obj);
  }
  return users;
}

module.exports = {
  getDateFormat,
  addNewEvent,
  getUserData,
  getFriendship,
  getFriendsId,
  getFriendshipObj,
  updateFriendCount,
  getPost,
  getLikeOrNot,
  getUserSearchObj
}
