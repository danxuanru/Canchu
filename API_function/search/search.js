require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const { getFriendship } = require('./model.js');

async function userSearch (req,res) {
    // search?keyword=...
    const keyword = req.query.keyword;
    const token = res.locals.token;
    const user = jwt.verify(token, secretKey);
    const user_id = user.id
    
    console.log(keyword);
    if(!keyword){
        return res.status(400).json({error: 'No keyword'});
    }

    const query = 'SELECT * FROM users WHERE `name` LIKE ?';
    const results = await pool.query(query, [`%${keyword}%`]);
    
    console.log(results[0]);

    let users = [];
    for(let i=0; i<results[0].length; i++){
        
        // friendship with user
        let friend_id = results[0][i].id;
        let friendship = await getFriendship(user_id, friend_id);
        // console.log(result[0]);
       
        const search_obj = {
            id: friend_id,
            name: results[0][i].name,
            picture: results[0][i].picture,
            friendship
        }
        users.push(search_obj);
    }

    return res.json({data: {users}});
}

module.exports = { userSearch };