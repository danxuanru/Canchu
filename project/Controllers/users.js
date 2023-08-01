/* eslint-disable camelcase */
/* eslint-disable semi */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../database');
// const { cacheUserProfileData, clearCache } = require('../cache');
const { cacheUserProfileData } = require('../utils/redis');
const { getFriendship } = require('../Model/friendModel');
const { getProfileData } = require('../Model/profileModel');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

function validateEmail (email) {
  // regular expression:
  // [^] start , [$] end
  // [\w-] all number, letter, _ , -
  // [+] 1 or more , [*] 0 or more
  // {at least , more than}
  const pattern = /^[\w-]+(\.[\w-]+)*@[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*(\.[a-zA-Z]{2,})/;
  // test
  return pattern.test(email);
}

/* sign-up */
async function signUp (req, res) {
  const { name, email, password } = req.body;

  // check request header
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
  }

  // validate request body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Client Error Response' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid Email Format' });
  }

  // check email exists or not
  try {
    const results = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    // email exists
    if (results[0].length > 0) { return res.status(403).json({ error: 'Email Already Exists' }); }

    // hash password
    const hashPassword = await bcrypt.hash(password, 10);
    const insertData = {
      name,
      provider: 'native',
      email,
      password: hashPassword
    }

    // insert new user into database
    const result = await pool.query('INSERT INTO users SET ?', insertData);

    // generate and sign the JWT token
    /**
         *  .sign() payload, secret key
         */
    const userId = result.insertId;

    const payload = {
      id: userId,
      name,
      email
    };
    const token = jwt.sign(payload, `${process.env.JWT_SECRET_KEY}`);

    // prepare the response object (result.insertId is build-in)
    const user = {
      id: userId,
      provider: 'native',
      name,
      email,
      picture: null
    };

    const response = {
      access_token: token,
      user
    };

    return res.json({ data: response });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error Response' });
  }
}

/* sign-in */
async function signIn (req, res) {
  try {
    const { provider, email, password } = req.body;

    // check request header
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
    }

    if (provider === 'native') {
      // data missing
      if (!email | !password) { return res.status(400).json({ error: 'Incomplete Data!' }); }

      // check email, password is already exists in database
      // const userData = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);

      const results = await pool.query('SELECT * FROM users WHERE email = ?', email);

      if (results.length === 0) { return res.status(403).json({ error: 'Email Does Not Found!' }); }

      // password authentication
      const userData = results[0][0];
      console.log(userData);

      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (!passwordMatch) { return res.status(403).json({ error: 'Incorrect Password' }); }

      const token = jwt.sign({ id: userData.id, name: userData, email: userData.email }, `${process.env.JWT_SECRET_KEY}`);

      // response
      const user = {
        id: userData.id,
        provider: userData.provider,
        name: userData.name,
        email: userData.email,
        picture: userData.picture
      }
      return res.json({ data: { access_token: token, user } });

      // } else if (provier === 'facebook') {
      //     // access_token missing
      //     if (!access_token) {
      //         return res.status(400).json({ error: 'Access Token Missing'});
      //     }
      //     // verify access token & get id, name, email, picture

      //     // response
      //     const data = {

      //     }

      //     return res.json({access_token: access_token, data});
    } else {
      return res.status(403).json({ error: 'Wrong provider' });
    }
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* get profile */
async function getProfile (req, res) {
  const targetUserId = req.params.id; // get parameters
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const userId = user.id;
  console.log('target user id: ' + targetUserId);
  // find data based on id & email
  try {
    console.log('get user: ' + targetUserId + ' profile');
    // const user = await getProfileData(userId, targetUserId);
    const user = await cacheUserProfileData(userId, targetUserId);

    // const query = 'SELECT id, name, picture, introduction, tags, friend_count FROM users WHERE id = ?';
    // const results = await pool.query(query, [targetUserId]);

    // if (results[0].length === 0) { return res.status(400).json({ error: 'User not found' }); }

    // const { id, name, picture, introduction, tags, friend_count } = results[0][0];

    // // get friend_count
    // // const friends = await getFriendsId(targetUserId);
    // // console.log('friends:' + friends);
    // // const friend_count = friends.length;
    // // console.log('friend count: ' + friend_count);

    // const friendship = await getFriendship(userId, targetUserId, 'friend');

    // // response
    // const user = {
    //   id,
    //   name,
    //   picture,
    //   friend_count,
    //   introduction,
    //   tags,
    //   friendship
    // }
    return res.status(200).json({ data: { user } });
  } catch (error) {
    console.log('SELECT user error', error);
    return res.status(500).json({ error: 'Server Error' });
  }
};

/* picture update */
async function updatePicture (req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const userId = user.id;

  // use FileReader API: img file -> link
  const imgURL = `https://3.24.21.167/images/${req.file.filename}`;
  // console.log(req.file.path);
  // console.log(imgURL);

  // insert data to database
  try {
    await pool.query('UPDATE users SET picture = ? WHERE id = ?', [imgURL, userId]);
    console.log('URL:' + imgURL);

    // // update - clear cache
    // await clearCache(userId);

    return res.json({ data: { picture: imgURL } });
  } catch (error) {
    console.error('Insert into users failed: ', error);
    return res.status(500).json({ error: 'Server Error!' });
  }
}

/* profile update */
async function updateProfile (req, res) {
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const userId = user.id;

  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
  }

  try {
    const { name, introduction, tags } = req.body;

    if (!name && !introduction && !tags) { return res.status(400).json({ error: 'No update!' }); }

    const results = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    // console.log(results);
    if (results[0].length === 0) { return res.status(403).json({ error: 'User Not Found!' }); }

    // const userFriend = userData.friendship.id;
    await pool.query('UPDATE users SET name = ?, introduction = ?, tags = ? WHERE id = ?',
      [name, introduction, tags, userId]);

    // // update - clear cache
    // await clearCache(userId);

    return res.json({ data: { user: { id: userId } } });
  } catch (error) {
    console.error('Error updatinfg user profile:', error);
    return res.status(500).json({ error: 'Server Error!' });
  }
}

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

module.exports = {
  signIn,
  signUp,
  getProfile,
  updatePicture,
  updateProfile,
  userSearch
};
