require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const app = express();
app.use(express.json());

async function requestFriend (req, res){

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
            // console.log(results[0]);
            return res.status(400).json({error: 'Already Request!'});  
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
}

async function getPendingFriends(req, res) {

    // authorization
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No Token!' });
    
    try {
        let userId;
        try {
            const user = jwt.verify(token, secretKey); 
            userId = user.id;
            console.log(userId);
        } catch (error) {
            return res.status(403).json({ error: 'Invalid Token'});
        }
    
        const sql = 'SELECT * FROM users JOIN friendship ON users.id = friendship.user1_id WHERE friendship.user2_id = ? AND friendship.status = ?';
        // const query = 'SELECT * FROM friendship WHERE user1_id = ? AND status = ?';
        const results = await pool.query(sql, [userId, "pending"]);
        
        console.log(results);
        console.log(results[0]);
        console.log(results[0].length);

        let users = [];
        for (let i = 0; i < results[0].length; i++) {
            let id = results[0][i].user1_id;
            let friendship_id = results[0][i].id;
           
            let search_obj = {
            id,
            name: results[0][i].name,
            picture: results[0][i].picture,
            friendship: { id: friendship_id, status: 'pending' },
            };
            users.push(search_obj);
            console.log(search_obj);
            
        }

        return res.json({ data: { users } });

    }catch(err){
        console.error('Error: ', err);
        return res.status(500).json({ error: 'Server Error'});
    }
}

module.exports = {
    requestFriend,
    getPendingFriends
};