require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pool = require('./database.js');
const port = 5000;
const DBport = process.env.DB_PORT;
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const app = express();
app.use(express.json());

const authenticateToken = (req, res, next) => {
    
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jwt.verify(token, secretKey, (err, user) => {
        if(err)
            return res.status(403).json({ error: 'Invalid Token'});
        // user: decode payload {id, name, email}
        req.user = user;
        next();
    });
};


const checkRequestHeader = (req, res, next) => {
    
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
    }
    next();
};

// --------------------------------------------------------
/* get profile */
app.get('/api/1.0/users/:id/profile', (req, res) => {

    const userId = req.params.id;  // get parameters

    // header authorization
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    // console.log(token);
    if(!token) 
        return res.status(401).json({ error: 'No Token!'});
    
    // verify token
    jwt.verify(token, secretKey, (err, user) => {
        
        if(err)
            return res.status(403).json({ error: 'Invalid Token'});
        
        // check user id
        // user.id - number , userId - string
        // if(user.id != parseInt(userId))
        //     return res.status(400).json({error: 'Invalid User ID'});

        // find data based on id & email        
        pool.query('SELECT * FROM users WHERE id = ?', [userId], (error ,results) => {
            if(error)
                return res.status(500).json({ error: 'Server Error Response'});
            
            if(results.length === 0)
                return res.status(400).json({ error: 'User not found'});
            
            const userData = results[0];

            const friendship = JSON.parse(userData.friendship);
            // console.log(friendship);

            const friend_count = 0;
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
            return res.status(200).json({data: user}); 
        });
    });

});

/* picture update */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload');
    },
    filename: (req,file, cb) => {
        // const name = path.extname(file.originalname);
        // cb(null, `${name}`);
        cb(null, file.fieldname + '-' + Date.now())
    }
});

app.use(express.static(__dirname +'/upload'));
/**
 * 這行程式碼的目的是將位於public/images資料夾中的檔案提供給客戶端
 * 並使用/images作為路由前綴
 * 當客戶端發出以/images開頭的請求時
 * Express將在public/images資料夾中尋找相對應的檔案並回傳給客戶端
 */

const upload = multer({ storage });  // create a instance

app.put('/api/1.0/users/picture', upload.single('picture'), (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log(req.file);

    // if(req.headers['Content-Type'] !== 'multipart/form-data')
    //     return res.status(400).json({ error: 'Invalid content type. Only multipart/form-data is accepted.' });
    
    // header authorization
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    // console.log(token);
    if(!token) 
        return res.status(401).json({ error: 'No Token!'});
    
    // verify token
    jwt.verify(token, secretKey, (err, user) => {
        
        if(err)
            return res.status(403).json({ error: 'Invalid Token'});
    
        // use FileReader API: img file -> link 
        const imgURL = `https://10.100.1.7/images/${req.file.filename}`;
        console.log(req.file.path);
        console.log(imgURL);
        
        // insert data to database
        pool.query('UPDATE users SET picture = ?', [imgURL], (error, results,fields) => {
            if(error) {
                console.error('Insert into users failed: ', error);
                return res.status(500).json({ error: 'Server Error!'});
            }
            res.json({data: {picture: imgURL}});
        });
    });

    // response: data-picture link

});


/* profile update */
app.put('/api/1.0/users/profile', async (req,res) => {

    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
    }

    // authorization: get id from token
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    if(!token) 
        return res.status(401).json({ error: 'No Token!'});

    try {
    const {name, introduction, tags} = req.body;

    if(!name && !introduction && !tags)
        return res.status(400).json({ error: 'No update!'})

    const user = await jwt.verify(token, secretKey);

    const results = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
    if(results.length === 0)
        return res.status(403).json({ error: 'User Not Found!'});
    
    // const userFriend = userData.friendship.id;

    await pool.query('UPDATE users SET name = ?, introduction = ?, tags = ? WHERE id = ?',
    [name, introduction, tags, user.id]);
                
    return res.json({data: {user: {id: user.id} } });

    } catch(error) {
        console.error('Error updatinfg user profile:', error);
        return res.status(500).json({ error: 'Server Error!' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});