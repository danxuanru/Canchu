require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const port = 80;

const {signUp} = require('./signup.js');
const {signIn} = require('./signin.js');
const { getProfile, updatePicture, updateProfile } = require('./profile.js');
const { authenticateToken } = require('./token.js');

const { requestFriend, getPendingFriends } = require('./friends.js');

const app = express();
app.use(express.json());

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
const upload = multer({ storage });  // create a instance


app.post('/api/1.0/users/signup', signUp);
app.post('/api/1.0/users/signin', signIn);

app.get('/api/1.0/users/:id/profile', authenticateToken, getProfile, updateProfile);
app.put('/api/1.0/users/profile', authenticateToken);
app.put('/api/1.0/users/picture', upload.single('picture'), authenticateToken, updatePicture);

app.get('/api/1.0/friends/pending', authenticateToken, getPendingFriends);
app.post('/api/1.0/friends/:user_id/request', authenticateToken, requestFriend);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});