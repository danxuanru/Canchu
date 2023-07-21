/* eslint-disable camelcase */
require('dotenv').config()
const jwt = require('jsonwebtoken')
const pool = require('./database')

const secretKey = `${process.env.JWT_SECRET_KEY}`
const { getDateFormat, getUserData, getLikeOrNot } = require('./model')

/* create post */
async function createPost (req, res) {
  const { context } = req.body
  const token = res.locals.token
  console.log(context)

  // authorize content-type: application/json
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' })
  }

  try {
    // get user id, name
    const user = jwt.verify(token, secretKey)
    const user_id = user.id
    // create a function
    // const name = getUserData(user_id, name);
    // const query = 'SELECT name, picture FROM users WHERE id = ?';
    // const result = await pool.query(query, [user_id]);

    const { name, picture } = await getUserData(user_id, ['name', 'picture'])
    // console.log('result: '+ result);
    // const name = result[0].name;
    // const picture = result[0].picture;
    console.log(name)
    console.log(picture)

    // get date
    const date = getDateFormat()

    // INSERT new post
    const insert = 'INSERT INTO posts (user_id, context, created_at, like_count, comment_count) VALUES (?,?,?,?,?)'
    const post = await pool.query(insert, [user_id, context, date, 0, 0])
    const post_id = post[0].insertId

    return res.json({ data: { post: { id: post_id } } })
  } catch (error) {
    console.error('error: ', error)
    return res.status(500).json({ error: 'Server Error' })
  }
}

/* update post */
async function updatePost (req, res) {
  const { context } = req.body
  const post_id = req.params.id

  try {
    // UPDATE post_id's post
    const query = 'UPDATE posts SET context = ? WHERE id = ?'
    await pool.query(query, [context, post_id])

    return res.json({ data: { post: { id: post_id } } })
  } catch (error) {
    console.error('SELECT error: ', error)
    return res.status(500).json({ error: 'Server Error' })
  }
}

/* post detail */
async function getPostDetail (req, res) {
  const post_id = parseInt(req.params.id) // should add error handling
  const token = res.locals.token
  const user = jwt.verify(token, secretKey)
  const user_id = user.id

  try {
    // get picture, name from users
    // getUserData()

    // const query = `SELECT P.*, C.id, C.user_id, C.content, C.created_at
    //     FROM posts as P inner join post_comments as C on P.id = C.post_id
    //     WHERE P.id = ?`;

    const post_results = await pool.query('SELECT * FROM posts WHERE id = ?', [post_id])
    const postData = post_results[0][0]

    // const query = 'SELECT id, user_id, content, created_at FROM post_comments WHERE post_id = ?';
    const query = `SELECT C.id, C.user_id, C.content, C.created_at, U.name, U.picture
          FROM post_comments as C inner join users as U on C.user_id = U.id
          WHERE C.post_id = ?`
    const comment_results = await pool.query(query, [post_id])

    const is_liked = getLikeOrNot(post_id, user_id)

    const comments = []
    for (let i = 0; i < comment_results[0].length; i++) {
      const data = comment_results[0][i]

      const user = {
        id: data.user_id,
        name: data.name,
        picture: data.picture
      }

      const comment_obj = {
        id: data.id,
        created_at: data.created_at,
        content: data.content,
        user
      }
      comments.push(comment_obj)
    }

    const post = {
      id: post_id,
      created_at: postData.created_at,
      context: postData.context,
      summary: postData.summary,
      is_liked,
      like_count: postData.like_count,
      comment_count: postData.comment_count,
      picture: postData.picture,
      name: postData.name,
      comments
    }
    return res.json({ data: { post } })
  } catch (error) {
    console.error('error: ', error)
    return res.status(500).json({ error: 'Server Error' })
  }
}

/* create like */
async function createPostLike (req, res) {
  const post_id = req.params.id
  const token = res.locals.token
  const user = jwt.verify(token, secretKey)
  const user_id = user.id

  try {
    // INSERT post_id's post_likes
    const query = 'INSERT INTO post_likes (post_id, user_id) VALUES (?,?)'
    await pool.query(query, [post_id, user_id])

    // update post's like_count
    // const count = 'UPDATE posts SET like_count = ( SELECT COUNT(*) FROM post_likes WHERE post_id = ?) WHERE id = ?';
    // await pool.query(count, [post_id, post_id]);
    await pool.query('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [post_id])

    return res.json({ data: { post: { id: post_id } } })
  } catch (error) {
    console.error('SELECT error: ', error)
    return res.status(500).json({ error: 'Server Error' })
  }
}

/* delete like */
async function deletePostLike (req, res) {
  const post_id = req.params.id
  const token = res.locals.token
  const user = jwt.verify(token, secretKey)
  const user_id = user.id

  try {
    // // SELECT like_id
    // const select = 'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?';
    // const result = await pool.query(select, [post_id ,user_id]);
    // const like_id = result[0][0];

    // // UPDATE post_id's post_likes is_delete
    // const query = 'UPDATE post_likes SET is_delete = true WHERE id = ?';
    // await pool.query(query, [like_id]);

    // directly delete
    const query = 'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?'
    const result = await pool.query(query, [post_id, user_id])
    console.log(result[0].affectedRows)

    // update post's like_count
    if (result[0].affectedRows === 1) { await pool.query('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [post_id]) }

    return res.json({ data: { post: { id: post_id } } })
  } catch (error) {
    console.error('SELECT error: ', error)
    return res.status(500).json({ error: 'Server Error' })
  }
}

/* create comment */
async function createPostComment (req, res) {
  const post_id = parseInt(req.params.id)
  const { content } = req.body
  console.log(content)
  const token = res.locals.token
  const user = jwt.verify(token, secretKey)
  const user_id = user.id

  try {
    const date = getDateFormat()

    // INSERT post_id's post_likes
    const query = 'INSERT INTO post_comments (post_id, user_id, content, created_at) VALUES (?,?,?,?)'
    const result = await pool.query(query, [post_id, user_id, content, date])
    console.log(result[0])
    const comment_id = result[0].insertId

    // update post's like_count
    await pool.query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [post_id])

    return res.json({ data: { post: { id: post_id }, comment: { id: comment_id } } })
  } catch (error) {
    console.error('SELECT error: ', error)
    return res.status(500).json({ error: 'Server Error' })
  }
}

module.exports = {
  createPost,
  updatePost,
  getPostDetail,
  createPostLike,
  deletePostLike,
  createPostComment
}
