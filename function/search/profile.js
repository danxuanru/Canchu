require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
// const timeout = require('connect-timeout');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;


const app = express();
app.use(express.json());

// --------------------------------------------------------
/* get profile */
async function getProfile (req, res) {

    const userId = req.params.id;  // get parameters

    // header authorization
    // await authenticateToken(req, res);    
    
    // find data based on id & email 
    try {
        const query = 'SELECT id, name, picture, introduction, tags, friendship FROM users WHERE id = ?';
        const results = await pool.query(query, [userId]);
        
        if(results[0].length === 0)
                return res.status(400).json({ error: 'User not found'});
            
        const userData = results[0][0];
        // console.log(userData);
        const friendship = JSON.parse(userData.friendship);
        // console.log(friendship);

        let friend_count = 0;
        if(isNaN(friendship))
            friend_count = Object.keys(friendship.length);
        
        // response
        const user = {
            id: userData.id,
            name: userData.name,
            picture: userData.picture,
            friend_count ,
            introduction: userData.introduction,
            tags: userData.tags,
            friendship: friendship
        }
        return res.status(200).json({data: {user: user}}); 

    } catch(error) {
        console.log('SELECT user error', error);
        return res.status(500).json({ error: 'Server Error'});
    }

};


/* picture update */
async function updatePicture (req, res) {
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    //await authenticateToken(req, res); 
    
    // use FileReader API: img file -> link 
    const imgURL = `https://10.100.1.7/images/${req.file.filename}`;
    //console.log(req.file.path);
    //console.log(imgURL);
        
    // insert data to database
    try {
        await pool.query('UPDATE users SET picture = ?', [imgURL]);
        console.log(imgURL);
        return res.json({data: {picture: imgURL}});
        

    } catch (error){
        console.error('Insert into users failed: ', error);
        return res.status(500).json({ error: 'Server Error!'});
    }
}


/* profile update */
async function updateProfile (req,res){

    const token = res.locals.token;
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
    }
    
    // header authorization

    try {
        const {name, introduction, tags} = req.body;

        if(!name && !introduction && !tags)
            return res.status(400).json({ error: 'No update!'})

        const user = jwt.verify(token, secretKey);

        const results = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
        // console.log(results);
        if(results[0].length === 0)
            return res.status(403).json({ error: 'User Not Found!'});

        // const userFriend = userData.friendship.id;

        await pool.query('UPDATE users SET name = ?, introduction = ?, tags = ? WHERE id = ?',
        [name, introduction, tags, user.id]);
                    
        return res.json({data: {user: {id: user.id} } });

    } catch(error) {
        console.error('Error updatinfg user profile:', error);
        return res.status(500).json({ error: 'Server Error!' });
    }
}


module.exports = {
    getProfile,
    updatePicture,
    updateProfile
};