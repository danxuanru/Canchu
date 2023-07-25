/* eslint-disable camelcase */
/* eslint-disable semi */
require('dotenv').config();
const express = require('express');
const pool = require('./project/database.js');
const { getDateFormat } = require('../utils.js');

const app = express();
app.use(express.json());

async function addNewEvent (type, user_id, receiver_id) {
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
    return { error: 'Server Error' };
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

module.exports = { addNewEvent };
