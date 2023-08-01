/* eslint-disable semi */
const express = require('express');
const { authenticateToken } = require('../utils/authorization');
const { createPost, updatePost, createPostLike, deletePostLike, createPostComment, getPostDetail, postSearch } = require('../Controllers/posts');
const router = express.Router();

router.post('/posts/', authenticateToken, createPost);
router.put('/posts/:id', authenticateToken, updatePost);
router.post('/posts/:id/like', authenticateToken, createPostLike);
router.delete('/posts/:id/like', authenticateToken, deletePostLike);
router.post('/posts/:id/comment', authenticateToken, createPostComment);
router.get('/posts/:id', authenticateToken, getPostDetail);
router.get('/posts/search', authenticateToken, postSearch);

module.exports = router;
