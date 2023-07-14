require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const port = 80;
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const app = express();
app.use(express.json());

/** Friend Request
 *  向user_id發出交友邀請
 */
app.post('/api/1.0/friends/:user_id/request', (req, res) =>{

    const inviteeId = parseInt(req.params.user_id);  // get parameters

    // header authorization
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    // console.log(token);
    if(!token) 
        return res.status(401).json({ error: 'No Token!'});
    
    // verify token
    jwt.verify(token, secretKey, async (err, user) => {
        
        if(err)
            return res.status(403).json({ error: 'Invalid Token'});

        const userId = user.id;

        // user request 

        // check friendship
        // try {

        //     const searchQuery = 'SELECT * FROM friendship WHERE user1_id = ? AND user2_id = ?';
        //     const results = await pool.query(searchQuery, [userId, inviteeId]);
        //     if(results.length > 0)
        //         return res(results[0]);  

        //     const query = 'INSERT INTO friendship (user1_id, user2_id, status) VALUE (?, ?, ?)';
        //     const insertResult = await pool.query(query, [userId, inviteeId, 'pending']);

        //     console.log(results);
        //     const friendship_id = insertResult.insertId;
        //     console.log(friendship_id);
        //     const friendshipData = {
        //         id: friendship_id,
        //         status: 'pending'
        //     }
        //     return res.json({data: {friendship: { id: friendship_id } }});

        // } catch (error) {
        //     console.error('Insert into users failed: ', error);
        //     return res.status(500).json({ error: 'Server Error' });
        // }
        

        const searchQuery = 'SELECT * FROM friendship WHERE user1_id = ? AND user2_id = ?';
        pool.query(searchQuery, [userId, inviteeId], (err, results) => {
            if(err)
                return res.status(500).json({ error: 'Server Error'});
            
            if(results.length > 0) {
                console.log(results[0]);
                return res.json({message: results[0]});  
            }

            // add to friendship table & get friendship ID
            const query = 'INSERT INTO friendship (user1_id, user2_id, status) VALUE (?, ?, ?)';
            pool.query(query, [userId, inviteeId, 'pending'], (err, result) => {
                if(err)
                    return res.status(500).json({ error: 'Server Error'});
                
                // console.log(result);
                const friendship_id = result.insertId;

                const friendshipData = {
                    id: friendship_id,
                    status: 'pending'
                }

                /* friendship_id request save in users.friendship */
                // pool.query('INSERT INTO users (friendship) VALUE (?)', [JSON.stringify(friendshipData)], (err, result) => {
                //     if(err) {
                //         console.error('Insert into users failed: ', error);
                //         return res.status(500).json({ error: 'Server Error' });
                //     }
                //     return res.json({data: {friendship: { id: friendship_id } }});
                // });
                return res.json({data: {friendship: { id: friendship_id } }});
            });
        });
            
        
       
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});