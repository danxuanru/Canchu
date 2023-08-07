require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const app = express();
app.use(express.json());

async function friendDelete (req, res) {

    const friendship_id = req.params.friendship_id;
    const token = res.locals.token;
    
   // check user.id is user2_id 
   const select = 'SELECT user2_id FROM friendship WHERE id = ?';
   const results = await pool.query(select, [friendship_id]);
   
   // console.log(results[0][0]);
   const user2_id = results[0][0].user2_id;

   const user = jwt.verify(token, secretKey);

   if(user.id !== user2_id)
       return res.status(400).json({error: 'You Can\'t Delete This Request!'});

    // update friendship.status = pending
    const deleteFriendship = 'DELETE from friendship WHERE id = ?';
    await pool.query(deleteFriendship, [friendship_id]);

    res.json({data: {friendship: {id: friendship_id} } });
}

module.exports = { friendDelete };