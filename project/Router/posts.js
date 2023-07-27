/* eslint-disable semi */
/* eslint-disable camelcase */
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const secretKey = `${process.env.JWT_SECRET_KEY}`;
const getDateFormat = require('../utils');
const { authenticateToken } = require('../authorization');
const { getFriendsId } = require('../Model/friendModel.js');
const { getPost, getLikeOrNot } = require('../Model/postModel.js')

const router = express.Router();

/* create post */
async function createPost (req, res) {
  console.log('create post');

  const { context } = req.body;
  const token = res.locals.token;

  // authorize content-type: application/json
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
  }

  try {
    // get user id, name
    const user = jwt.verify(token, secretKey);
    const user_id = user.id;
    // create a function
    // const name = getUserData(user_id, name);
    // const query = 'SELECT name, picture FROM users WHERE id = ?';
    // const result = await pool.query(query, [user_id]);

    // const { name, picture } = await getUserData(user_id, ['name', 'picture'])
    // console.log('result: '+ result);
    // const name = result[0].name;
    // const picture = result[0].picture;
    // console.log('name:' + name)
    // console.log('picture: ' + picture)

    // get date
    const date = getDateFormat();

    // INSERT new post
    const insert = 'INSERT INTO posts (user_id, context, created_at, like_count, comment_count) VALUES (?,?,?,?,?)';
    const post = await pool.query(insert, [user_id, context, date, 0, 0]);
    const post_id = post[0].insertId;

    return res.json({ data: { post: { id: post_id } } });
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* update post */
async function updatePost (req, res) {
  console.log('update post');

  const { context } = req.body;
  const post_id = req.params.id;

  try {
    // UPDATE post_id's post
    const query = 'UPDATE posts SET context = ? WHERE id = ?';
    await pool.query(query, [context, post_id]);

    return res.json({ data: { post: { id: post_id } } });
  } catch (error) {
    console.error('SELECT error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* post detail */
async function getPostDetail (req, res) {
  const post_id = parseInt(req.params.id); // should add error handling
  console.log('post id: ' + post_id);
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const visiter_id = user.id;

  console.log(visiter_id + ' get post ' + post_id + 'detail');

  try {
    // const query = `SELECT P.*, C.id, C.user_id, C.content, C.created_at
    //     FROM posts as P inner join post_comments as C on P.id = C.post_id
    //     WHERE P.id = ?`;
    const postQuery = `SELECT P.*, U.picture as picture, U.name as name
                        FROM posts as P INNER JOIN users as U ON U.id = P.user_id
                        WHERE P.id = ?`;
    const post_results = await pool.query(postQuery, [post_id]);

    const { user_id, created_at, context, summary, like_count, comment_count, picture, name } = post_results[0][0];

    const query = `SELECT C.id, C.user_id, C.content, C.created_at, U.name, U.picture
          FROM post_comments as C inner join users as U on C.user_id = U.id
          WHERE C.post_id = ?`
    const comment_results = await pool.query(query, [post_id]);

    // console.log('post/user id: ' + post_id, visiter_id);
    const is_liked = await getLikeOrNot(post_id, visiter_id);
    // console.log('is_like: ' + is_liked);

    const comments = [];
    for (let i = 0; i < comment_results[0].length; i++) {
      const { user_id, name, picture, id, created_at, content } = comment_results[0][i];

      const user = {
        id: user_id,
        name,
        picture
      }

      const comment_obj = {
        id,
        created_at,
        content,
        user
      }
      comments.push(comment_obj);
    }

    const post = {
      id: post_id,
      user_id,
      created_at,
      context,
      summary,
      is_liked,
      like_count,
      comment_count,
      picture,
      name,
      comments
    }
    return res.json({ data: { post } });
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* create like */
async function createPostLike (req, res) {
  const post_id = req.params.id;
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const user_id = user.id;

  console.log(user_id + ' like post ' + post_id);

  try {
    // check like or not
    if (await getLikeOrNot(post_id, user_id) === true) return res.status(400).json({ error: 'Already liked this post!' });

    // INSERT post_id's post_likes
    const query = 'INSERT INTO post_likes (post_id, user_id) VALUES (?,?)';
    await pool.query(query, [post_id, user_id]);
    // console.log('like id: ' + insert[0].insertId);

    // update post's like_count
    // const count = 'UPDATE posts SET like_count = ( SELECT COUNT(*) FROM post_likes WHERE post_id = ?) WHERE id = ?';
    // await pool.query(count, [post_id, post_id]);
    await pool.query('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [post_id]);

    return res.json({ data: { post: { id: post_id } } });
  } catch (error) {
    console.error('SELECT error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* delete like */
async function deletePostLike (req, res) {
  const post_id = req.params.id;
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const user_id = user.id;

  console.log(user_id + ' cancel like post ' + post_id);

  try {
    // // UPDATE post_id's post_likes is_delete
    // const query = 'UPDATE post_likes SET is_delete = true WHERE id = ?';
    // await pool.query(query, [like_id]);

    // directly delete
    const query = 'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?';
    const result = await pool.query(query, [post_id, user_id]);
    // console.log('delete result: ' + result[0]);
    // console.log(result[0].affectedRows);

    // update post's like_count
    if (result[0].affectedRows > 0) {
      await pool.query('UPDATE posts SET like_count = like_count-1 WHERE id = ?', [post_id]);
    } else {
      return res.status(400).json({ error: 'You have not liked this post before!' });
    }
    return res.json({ data: { post: { id: post_id } } });
  } catch (error) {
    console.error('DELETE error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* create comment */
async function createPostComment (req, res) {
  const post_id = parseInt(req.params.id);
  const { content } = req.body;

  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const user_id = user.id;

  console.log(user_id + ' comment post ' + post_id);

  try {
    const date = getDateFormat();

    // INSERT post_id's post_likes
    const query = 'INSERT INTO post_comments (post_id, user_id, content, created_at) VALUES (?,?,?,?)';
    const result = await pool.query(query, [post_id, user_id, content, date]);

    const comment_id = result[0].insertId;

    // update post's like_count
    await pool.query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [post_id]);

    return res.json({ data: { post: { id: post_id }, comment: { id: comment_id } } });
  } catch (error) {
    console.error('SELECT error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* search post */
async function postSearch (req, res) {
  try {
    const { user_id, cursor } = req.query;
    const token = res.locals.token;
    const searcher = jwt.verify(token, secretKey);
    const searcher_id = searcher.id;

    console.log(searcher_id + ' search user ' + user_id + ' post');

    // cursor decode and convert to number
    const cursor_number = cursor ? Buffer.from(cursor, 'base64').toString() : 0;
    // console.log(cursor_number);

    // create query
    // let query = 'SELECT * FROM posts';
    const params = [];
    const limit = 10;

    // no userr_id - get own timeline
    if (!user_id) {
      // get my & myFriends post
      params.push(searcher_id, ...(await getFriendsId(searcher_id)));
      // const results = await getFriendsId(searcher_id);
      // results.map((result) => params.push(result.id));
      // console.log(params);
    } else {
      // get user_id's post
      params.push(user_id);
    }

    const results = await getPost(params, cursor_number, limit + 1);
    // console.log(results)
    const posts = [];
    const number_of_posts = results.length > limit ? limit : results.length;
    // console.log('post:'+number_of_posts);
    for (const [index, result] of results.slice(0, number_of_posts).entries()) {
      const is_liked = await getLikeOrNot(result.id, searcher_id);
      const { id, created_at, user_id, context, like_count, comment_count, picture, name } = result;
      const post_obj = {
        id,
        user_id,
        created_at,
        context,
        is_liked,
        like_count,
        comment_count,
        picture,
        name
      }
      posts.push(post_obj);
    }
    console.log('post result: ' + posts);

    // encode next_cursor
    // next_cursor = last post in the current page
    // console.log('last post:' + results[number_of_posts-1].id); // last post in current page
    // console.log('next post:' + results[number_of_posts].id);  // next post after current page
    const next_cursor = results[number_of_posts]
      ? Buffer.from((results[number_of_posts - 1].id).toString()).toString('base64')
      : null

    return res.json({ data: { posts, next_cursor } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.post('/:id/like', authenticateToken, createPostLike);
router.delete('/:id/like', authenticateToken, deletePostLike);
router.post('/:id/comment', authenticateToken, createPostComment);
router.get('/:id', authenticateToken, getPostDetail);
router.get('/search', authenticateToken, postSearch);

module.exports = router;
