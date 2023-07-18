require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');

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

    try {
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
    } catch(error) {
        console.error('Error: ', error);
        return res.status(500).json({ error: 'Server Error'});
    }
    return;

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


// -------------------------------------------------------------
async function getFriendship(user_id, friend_id){
    const query = 'SELECT id, status FROM friendship WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)';
    const results = await pool.query(query, [user_id,friend_id, friend_id, user_id]);
    
    console.log(results[0]);

    if(results[0].length === 0)
        return null;
    else {
        const friendship = {
            id: results[0][0].id,
            status: results[0][0].status
        }
        return friendship;
    }
}


module.exports = {
    getDateFormat,
    addNewEvent,
    getFriendship
}
