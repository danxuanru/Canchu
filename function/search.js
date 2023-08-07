/* eslint-disable semi */
/* eslint-disable camelcase */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const { getFriendship, getFriendsId } = require('./Model/friendModel.js');
const { getPost, getLikeOrNot } = require('./Model/postModel.js')

async function userSearch (req, res) {
  // search?keyword=...
  const keyword = req.query.keyword;
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const user_id = user.id;

  console.log('keyword: ' + keyword);
  if (!keyword) {
    return res.status(400).json({ error: 'No keyword' });
  }

  const query = 'SELECT id, name, picture FROM users WHERE `name` LIKE ?';
  const results = await pool.query(query, [`%${keyword}%`]);

  /**
   * User Search Object
   * { id, name, picture
   *   friendship - getFriendshipObj }
   */

  const users = []
  for (let i = 0; i < results[0].length; i++) {
    // friendship with user
    const { id, name, picture } = results[0][i];
    const friendship = await getFriendship(user_id, id);

    const search_obj = {
      id,
      name,
      picture,
      friendship
    }
    users.push(search_obj);
  }

  return res.json({ data: { users } });
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

module.exports = { userSearch, postSearch };
