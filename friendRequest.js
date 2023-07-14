require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const port = 5000;
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const { getPendingFriends } = require('./friendPending.js');

const app = express();
app.use(express.json());

app.get('/api/1.0/friends/pending', getPendingFriends);

/** Friend Request
 *  向user_id發出交友邀請
 */
app.post('/api/1.0/friends/:user_id/request', async (req, res) =>{

    const inviteeId = parseInt(req.params.user_id);  // get parameters

    // header authorization
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    // console.log(token);
    if(!token) 
        return res.status(401).json({ error: 'No Token!'});
       
    try {
        let userId;

        try{
            // verify token
            const user = jwt.verify(token, secretKey);
            userId = user.id;
            if(userId === inviteeId)
                return res.status(403).json({ error: 'Can\'t Friends Yourself!'});
            
        } catch (error) {
            return res.status(403).json({ error: 'Invalid Token'});
        }

        const searchQuery = 'SELECT * FROM friendship WHERE user1_id = ? AND user2_id = ?';
        const results = await pool.query(searchQuery, [userId, inviteeId]); 
        if(results[0].length > 0) {
            console.log(results[0]);
            return res.json({message: results[0]});  
        }

        // add to friendship table & get friendship ID
        const query = 'INSERT INTO friendship (user1_id, user2_id, status) VALUE (?, ?, ?)';
        const friendship = await pool.query(query, [userId, inviteeId, 'pending']); 

        const friendship_id = friendship[0].insertId;
        console.log(friendship[0]);
        console.log(friendship_id);

        const friendshipData = {
            id: friendship_id,
            status: 'pending'
        }
        return res.json({data: {friendship: friendshipData  }});

    } catch (error) {
        console.error('SELECT error: ', err);
        return res.status(500).json({ error: 'Server Error'});
    }
                
    /* friendship_id request save in users.friendship */
    // pool.query('INSERT INTO users (friendship) VALUE (?)', [JSON.stringify(friendshipData)], (err, result) => {
    //     if(err) {
    //         console.error('Insert into users failed: ', error);
    //         return res.status(500).json({ error: 'Server Error' });
    //     }
    //     return res.json({data: {friendship: { id: friendship_id } }});
    // });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});