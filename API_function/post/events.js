require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

// const { addReadEvent } = require('./model.js');

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
    try {
        // const event = {
        //     id: eventsId,
        //     type: data.type,
        //     is_read,
        //     image: data.image,
        //     created_at: data.created_at,
        //     summary: data.summary
        // }

        // read event: update is_read = true
        await pool.query('UPDATE events SET is_read = ?', [true]);
        
        return res.json({ data: {events: {id: eventsId}}});

    } catch(error) {
        console.error('Error: ', error);
        return res.status(500).json({ error: 'Server Error'});
    }
}

module.exports = {
    getEvents,
    readEvent
}