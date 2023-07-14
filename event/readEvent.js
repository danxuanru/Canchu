require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

// app.post('/api/1.0/events/:event_id/read', authenticateToken)
async function readEvents(req, res){
    try {
        const eventsId = req.params.event_id;
        const token = res.locals.token;
        const user = jwt.verify(token, secretKey);
        const userId = user.id;

        // select event_id data
        const select = 'SELECT * FROM events WHERE id = ?';
        const results = await pool.query(select, [eventsId]);
        const data = results[0][0];

        const event = {
            id: eventsId,
            type: data.type,
            is_read: data.is_read,
            image: data.image,
            created_at: data.created_at,
            summary: data.summary
        }

        // add new event: is_read = ture
        // 時間形態處理
        const time;

        const insert = 'INSERT INTO events (type, is_read, image, created_at, summary) VALUE (?,?,?,?,?)';
        await pool.query(insert, [data.type, true, data.image, time, data.summary]);
        
        return res.json({ data: {event}});

    } catch(error) {
        console.error('Error: ', err);
        return res.status(500).json({ error: 'Server Error'});
    }
}

module.exports = { readEvents };