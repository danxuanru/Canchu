require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const port = 80;
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const { authenticateToken } = require('./token.js');

const app = express();
app.use(express.json());

app.get('/api/1.0/users/search', authenticateToken, async (req,res) => {
    // search?keyword=...
    const keyword = req.query.keyword;
    
    console.log(keyword);
    if(!keyword){

    }

    const query = 'SELECT * FROM users WHERE `name` LIKE ?';
    const results = await pool.query(query, [`%${keyword}%`]);
    
    console.log(results);

    let users = [];
    for(let i=0; i<results[0].length; i++){
        
        const search_obj = {
            id: results[0][i].id,
            name: results[0][i].name,
            picture: results[0][i].picture,
            friendship: results[0][i].friendship
        }
        users.push(search_obj);
    }

    return res.json({data: {users}});
});

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
})