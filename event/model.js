require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const app = express();
app.use(express.json());

function getDateFormat(){
    let date = new Date();
    let year = String(date.getFullYear());
    let month = String(date.getMonth()+1);
    let day = String(date.getDate());
    let hours = String(date.getHours());
    let minutes = String(date.getMinutes());
    let seconds = String(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function addNewEvent(type, user_id, receiver_id){

    // add event (select user profile + insert into events)
    const profile = 'SELECT name, picture FROM users WHERE id = ?';
    const user = await pool.query(profile, [user_id]);
    const image = user[0][0].picture;
    const date = getDateFormat();

    let summary = `${user[0][0].name}邀請你成為好友`;
    if(type === 'agree_request')
        summary = `${user[0][0].name}同意你的好友邀請`;
    else if(type === 'delete_friend')
        summary = `${user[0][0].name}已將你從好友名單中刪除`;

    const insertEvent = `INSERT INTO events (type, is_read, image, summary, user_id, created_at) VALUE (?,?,?,?,?,?)`;
    await pool.query(insertEvent, [type, false, image, summary, receiver_id, date]);

}

module.exports = {
    addNewEvent
}
