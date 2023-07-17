require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

// app.post('/api/1.0/events/:event_id/read', authenticateToken)
async function readEvents(req, res){
    
        const eventsId = req.params.event_id;
        const token = res.locals.token;
        const user = jwt.verify(token, secretKey);
    try {
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
        console.error('Error: ', err);
        return res.status(500).json({ error: 'Server Error'});
    }
}

module.exports = { readEvents };