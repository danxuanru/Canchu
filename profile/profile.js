require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pool = require('./database.js');
const port = 5000;
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const {signUp} = require('./signup.js');
const {signIn} = require('./signin.js');
const { authenticateToken } = require('./token.js');

const app = express();
app.use(express.json());

app.post('/api/1.0/users/signup', signUp);
app.post('/api/1.0/users/signin', signIn);


// --------------------------------------------------------
/* get profile */
app.get('/api/1.0/users/:id/profile', authenticateToken, async (req, res) => {

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
        console.log(userData);
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

});

/* picture update */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req,file, cb) => {
        // const name = path.extname(file.originalname);
        // cb(null, `${name}`);
        cb(null, file.fieldname + '-' + Date.now())
    }
});

app.use(express.static(__dirname +'/images'));
/**
 * 這行程式碼的目的是將位於public/images資料夾中的檔案提供給客戶端
 * 並使用/images作為路由前綴
 * 當客戶端發出以/images開頭的請求時
 * Express將在public/images資料夾中尋找相對應的檔案並回傳給客戶端
 */

const upload = multer({ storage });  // create a instance

app.put('/api/1.0/users/picture', upload.single('picture'), authenticateToken, async (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    //await authenticateToken(req, res); 
    
    // use FileReader API: img file -> link 
    const imgURL = `https://10.100.1.7/images/${req.file.filename}`;
    //console.log(req.file.path);
    //console.log(imgURL);
        
    // insert data to database
    await pool.query('UPDATE users SET picture = ?', [imgURL], (error, results,fields) => {
        if(error) {
            console.error('Insert into users failed: ', error);
            return res.status(500).json({ error: 'Server Error!'});
        }
        res.json({data: {picture: imgURL}});
    });

});


/* profile update */
app.put('/api/1.0/users/profile', authenticateToken, async (req,res) => {

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
        console.log(results);
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
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});