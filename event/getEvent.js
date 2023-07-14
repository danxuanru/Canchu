require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const port = 80;
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const { authenticateToken } = require('./token.js');

const app = express();
app.use(express.json());

// 印出所有event?
app.get('/api/1.0/events/', authenticateToken, async (req, res) => {

    // get events data
    const query = 'SELECT * FROM event WHERE';
    const results = await pool.query(query);

    let events = [];
    for(let i=0; i<results[0].length; i++){
        
        let event = {
            id: results[0][i].id,
            type: results[0][i].type,
            is_read: results[0][i].is_read,
            image: results[0][i].image,
            created_at: results[0][i].created_at,
            summary: results[0][i].summary
        }
        console.log(event);
        events.push(event);
    }

    // response: Array of Event Object
    return res.json({data: {events}});
});
