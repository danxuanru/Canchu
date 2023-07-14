require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const port = 80;
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const { authenticateToken } = require('./token.js');
const { friendDelete } = require('./friendDelete.js');

const app = express();
app.use(express.json());

app.delete('/api/1.0/friends/:friendship_id', authenticateToken, friendDelete);

app.post('/api/1.0/friends/:friendship_id/agree', authenticateToken, async (req, res) => {

    const friendship_id = req.params.friendship_id;
    const token = res.locals.token;
    // const token = req.user; 
    // 用這種存法 回傳的是object 即使使用JSON.stringify()也後會有error
    
    // status = pending & check user.id is user2_id
    const select = 'SELECT user2_id, status FROM friendship WHERE id = ?';
    const results = await pool.query(select, [friendship_id]);
    
    // console.log(results[0][0]);
    const user2_id = results[0][0].user2_id;
    const status = results[0][0].status;

    if(status === 'accepted' )
        return res.status(400).json({error: 'You Have Agreed This Request!'});

    const user = jwt.verify(token, secretKey);
    console.log(user);
    // const userId = res.locals.id;
    // console.log(user.id);
    // console.log(user2_id);
    if(user.id !== user2_id)
        return res.status(400).json({error: 'You Can\'t Agree This Request!'});

        
    // update friendship.status = pending
    const update = 'UPDATE friendship SET status = ? WHERE id = ?';
    await pool.query(update, ["accepted", friendship_id]);

    // response 
    res.json({data: {friendship: {id: friendship_id} } });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});