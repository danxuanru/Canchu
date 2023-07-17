require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

async function getEvents(req, res) {

    const token = res.locals.token;
    const user = jwt.verify(token, secretKey);

    try {
        // get events data
        const query = 'SELECT * FROM events WHERE user_id = ?';
        const results = await pool.query(query, [user.id]);

        let events = [];
        for(let i=0; i<results[0].length; i++){
            const is_read = results[0][i].is_read === 1 ? true : false;  // how to get true & false from bool automatically

            let event = {
                id: results[0][i].id,
                type: results[0][i].type,
                is_read,
                image: results[0][i].image,
                created_at: results[0][i].created_at,
                summary: results[0][i].summary
            }
            console.log(event);
            events.push(event);
        }

        // response: Array of Event Object
        return res.json({data: {events}});

    } catch(error) {
        console.log('SELECT user error', error);
        return res.status(500).json({ error: 'Server Error'});
    }
}



async function readEvent(req, res){

    const eventsId = req.params.event_id;
    const token = res.locals.token;
    const user = jwt.verify(token, secretKey);
    try {
        // select event_id data
        const select = `SELECT * FROM events WHERE id = ?`;
        const results = await pool.query(select, [eventsId]);
        const data = results[0][0];
        const is_read = results[0][i].is_read === 1 ? true : false;

        const event = {
            id: eventsId,
            type: data.type,
            is_read,
            image: data.image,
            created_at: data.created_at,
            summary: data.summary
        }

        // add new event: is_read = ture
        // 時間形態處理
        let date = new Date();
        let year = String(date.getFullYear());
        let month = String(date.getMonth()+1);
        let day = String(date.getDate());
        let hours = String(date.getHours());
        let minutes = String(date.getMinutes());
        let seconds = String(date.getSeconds());
        const time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        // use DATE_FORMAT()
        const insert = `INSERT INTO events (type, is_read, image, summary, user_id, created_at) VALUE (?,?,?,?,?,?)`;
        await pool.query(insert, [data.type, true, data.image, data.summary, user.id, time]);
        
        return res.json({ data: {event}});

    } catch(error) {
        console.error('Error: ', error);
        return res.status(500).json({ error: 'Server Error'});
    }
}

module.exports = {
    getEvents,
    readEvent
}