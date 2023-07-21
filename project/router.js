/* eslint-disable import/extensions */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const port = 5000;

const { signUp } = require('./signup.js');
const { signIn } = require('./signin.js');
const { getProfile, updatePicture, updateProfile } = require('./profile.js');
const { authenticateToken } = require('./authorization.js');

const { requestFriend, getPendingFriends, agreeFriend, deleteFriend } = require('./friends.js');
const { getEvents, readEvent } = require('./events.js');
const { userSearch, postSearch } = require('./search.js');
const { createPost, updatePost, createPostLike, deletePostLike, createPostComment, getPostDetail } = require('./post.js');

const app = express();
app.use(cors());
app.use(express.json());
// app.use('/.well-known/pki-validation/', express.static(__dirname + '/images'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    // const name = path.extname(file.originalname);
    // cb(null, `${name}`);
    cb(null, `${file.fieldname}-${Date.now()}`);
  },
});
app.use(express.static(`${__dirname}/images`));
const upload = multer({ storage }); // create a instance

app.post('/api/1.0/users/signup', signUp);
app.post('/api/1.0/users/signin', signIn);

app.get('/api/1.0/users/:id/profile', authenticateToken, getProfile);
app.put('/api/1.0/users/profile', authenticateToken, updateProfile);
app.put('/api/1.0/users/picture', upload.single('picture'), authenticateToken, updatePicture);

app.get('/api/1.0/friends/pending', authenticateToken, getPendingFriends);
app.post('/api/1.0/friends/:user_id/request', authenticateToken, requestFriend);
app.post('/api/1.0/friends/:friendship_id/agree', authenticateToken, agreeFriend);
app.delete('/api/1.0/friends/:friendship_id', authenticateToken, deleteFriend);

app.get('/api/1.0/events/', authenticateToken, getEvents);
app.post('/api/1.0/events/:event_id/read', authenticateToken, readEvent);

app.get('/api/1.0/users/search', authenticateToken, userSearch);
app.get('/api/1.0/posts/search', authenticateToken, postSearch);

app.post('/api/1.0/posts/', authenticateToken, createPost);
app.put('/api/1.0/posts/:id', authenticateToken, updatePost);
app.post('/api/1.0/posts/:id/like', authenticateToken, createPostLike);
app.delete('/api/1.0/posts/:id/like', authenticateToken, deletePostLike);
app.post('/api/1.0/posts/:id/comment', authenticateToken, createPostComment);
app.get('/api/1.0/posts/:id', authenticateToken, getPostDetail);

app.listen(port, () => {
  console.log(`CORS-enabled web server is listening on port ${port}`);
});
