/* eslint-disable semi */
const express = require('express');
const { authenticateToken } = require('../utils/authorization');
const { createPost, updatePost, createPostLike, deletePostLike, createPostComment, getPostDetail, postSearch } = require('../Controllers/posts');
const router = express.Router();

router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.post('/:id/like', authenticateToken, createPostLike);
router.delete('/:id/like', authenticateToken, deletePostLike);
router.post('/:id/comment', authenticateToken, createPostComment);
router.get('/:id', authenticateToken, getPostDetail);
router.get('/search', authenticateToken, postSearch);

module.exports = router;
