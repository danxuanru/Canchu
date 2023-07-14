require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const port = 80;
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const app = express();
app.use(express.json());


const verifyToken = async (req, res) => {
    // authorization
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    if(!token) 
        return res.status(401).json({ error: 'No Token!'});

    jwt.verify(token, secretKey, async (err, user) => {
        if(err)
            return res.status(403).json({ error: 'Invalid Token'});
    });
}


/** Friend Pending
 *  所有pending status的交友邀請
 */
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
           
            let newUser = {
            id,
            name: results[0][i].name,
            picture: results[0][i].picture,
            friendship: { id: friendship_id, status: 'pending' },
            };
            users.push(newUser);
            console.log(newUser);
            
        }

        return res.json({ data: { users } });

    }catch(err){
        console.error('Error: ', err);
        return res.status(500).json({ error: 'Server Error'});
    }
}


function getUserData(id, friendship_id){
    const query = 'SELECT * friendship WHERE id = ?';
    pool.query(query, id, (err, user) => {
        if(err)
            return res.status(500).json({ error: 'Server Error!'});
        return {id, name: user.name, picture: user.picture, friendship: { id: friendship_id, status: 'pending'} };
    });
}

module.exports = {
    getPendingFriends
}