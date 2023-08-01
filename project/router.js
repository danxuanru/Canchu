/* eslint-disable semi */
/* eslint-disable import/extensions */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// const { signUp } = require('./signup.js');
// const { signIn } = require('./signin.js');
// const { getProfile, updatePicture, updateProfile } = require('./profile.js');
// const { authenticateToken } = require('./authorization.js');
// const { requestFriend, getPendingFriends, agreeFriend, deleteFriend, getFriends } = require('./friends.js');
// const { getEvents, readEvent } = require('./events.js');
// const { userSearch, postSearch } = require('./search.js');
// const { createPost, updatePost, createPostLike, deletePostLike, createPostComment, getPostDetail } = require('./post.js');

const app = express();

const corsOption = {
  origin: 'https://canchu-for-backend.vercel.app',
  method: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors());
app.use(express.json());

// app.set('trust proxy', true);
// app.use(limiter);

// app.use('/.well-known/pki-validation/', express.static(__dirname + '/images'));

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'images');
//   },
//   filename: (req, file, cb) => {
//     // const name = path.extname(file.originalname);
//     // cb(null, `${name}`);
//     cb(null, `${file.fieldname}-${Date.now()}`);
//   }
// });
// const upload = multer({ storage }); // create a instance

app.use('/images', express.static(`${__dirname}/images`));

const { rateLimiter } = require('./utils/rateLimiter');
app.use(rateLimiter);

// use router
const usersRouter = require('./Router/users_router');
const friendsRouter = require('./Router/friends_router');
const eventsRouter = require('./Router/events_router');
const postsRouter = require('./Router/posts_router');

app.use('/api/1.0/users', usersRouter);
app.use('/api/1.0/friends', friendsRouter);
app.use('/api/1.0/events', eventsRouter);
app.use('/api/1.0/posts', postsRouter);

// app.post('/api/1.0/users/signup', signUp);
// app.post('/api/1.0/users/signin', signIn);
// app.get('/api/1.0/users/:id/profile', authenticateToken, getProfile);
// app.put('/api/1.0/users/profile', authenticateToken, updateProfile);
// app.put('/api/1.0/users/picture', upload.single('picture'), authenticateToken, updatePicture);

// app.get('/api/1.0/friends/pending', authenticateToken, getPendingFriends);
// app.post('/api/1.0/friends/:user_id/request', authenticateToken, requestFriend);
// app.post('/api/1.0/friends/:friendship_id/agree', authenticateToken, agreeFriend);
// app.delete('/api/1.0/friends/:friendship_id', authenticateToken, deleteFriend);
// app.get('/api/1.0/friends/', authenticateToken, getFriends);

// app.get('/api/1.0/events/', authenticateToken, getEvents);
// app.post('/api/1.0/events/:event_id/read', authenticateToken, readEvent);

// app.get('/api/1.0/users/search', authenticateToken, userSearch);
// app.get('/api/1.0/posts/search', authenticateToken, postSearch);

// app.post('/api/1.0/posts/', authenticateToken, createPost);
// app.put('/api/1.0/posts/:id', authenticateToken, updatePost);
// app.post('/api/1.0/posts/:id/like', authenticateToken, createPostLike);
// app.delete('/api/1.0/posts/:id/like', authenticateToken, deletePostLike);
// app.post('/api/1.0/posts/:id/comment', authenticateToken, createPostComment);
// app.get('/api/1.0/posts/:id', authenticateToken, getPostDetail);

module.exports = app;
