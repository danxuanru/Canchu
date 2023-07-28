/* eslint-disable camelcase */
/* eslint-disable semi */
const pool = require('./database');
const { getDateFormat, getUserId } = require('./utils/utils');

/* create group */
// endpoint: /groups/
async function createGroup (req, res) {
  const { name } = req.body
  const userId = await getUserId(res);

  if (!name) return res.status(400).json({ error: 'No Group Name Included!' });

  try {
    // check name exists
    const is_exist = 'SELECT EXISTS( SELECT 1 FROM user_groups WHERE group_name = ?) AS result';
    const result = await pool.query(is_exist, [name]);
    if (result[0][0].result === 1) return res.status(400).json({ error: 'This Group already exists!' });

    // select group_id
    const get_id = await pool.query('SELECT MAX(group_id) as max_value from user_groups');
    console.log(get_id);
    const groupId = get_id[0][0].max_value ? (get_id[0][0].max_value + 1) : 1;
    console.log(groupId);
    // create group
    const sql = `INSERT INTO user_groups (group_id, user_id, group_name, status) 
              VALUE (?, ?, ?, ?)`;
    await pool.query(sql, [groupId, userId, name, 'creator']);

    return res.json({ data: { group: { id: groupId } } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* delete group */
// endpoint: /groups/:group_id
async function deleteGroup (req, res) {
  const groupId = req.params.group_id;
  const userId = await getUserId(res);
  try {
    // check user is creator of the group
    const is_creator = 'SELECT user_id FROM user_groups WHERE group_id = ? AND status = ?';
    const result = await pool.query(is_creator, [groupId, 'creator']);
    console.log(result[0][0].user_id);
    if (result[0][0].user_id !== userId) {
      return res.status(400).json({ error: 'You Can\'t Delete This Group!' });
    }

    // delete group (delete all group_id = groupId data in group table)
    const sql = 'DELETE from user_groups WHERE group_id = ?';
    await pool.query(sql, [groupId]);

    return res.json({ data: { group: { id: groupId } } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* join group */
// endpoint: /groups/:group_id/join
async function joinGroup (req, res) {
  const groupId = req.params.group_id;
  const userId = getUserId(res);

  try {
    // check user already in group
    // const is_exist = 'SELECT status FROM user_groups WHERE id = ? AND user_id = ?';
    const is_exist = 'SELECT EXISTS( SELECT 1 FROM user_groups WHERE group_id = ? AND user_id = ?) AS result';
    const result = await pool.query(is_exist, [groupId, userId]);
    console.log(result[0][0].result);
    if (result[0][0].result === 1) return res.status(400).json({ error: 'You have already apply!' });
    // if (result[0][0].status === 'pending') return res.status(400).json({ error: 'You have already apply!' });
    // if (result[0][0].status === 'member') return res.status(400).json({ error: 'You have already in this group!' });

    // add join apply
    const sql = 'INSERT INTO user_groups (group_id, user_id, status) VALUE (?, ?, ?)';
    await pool.query(sql, [groupId, userId, 'pending']);

    return res.json({ data: { group: { id: groupId } } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* get pending member */
// endpoint: /groups/:group_id/member/pending
async function getPendingMember (req, res) {
  const groupId = req.params.group_id;
  const userId = getUserId(res);

  try {
    // check user is creator of the group
    const is_creator = 'SELECT user_id FROM user_groups WHERE group_id = ? AND status = ?';
    const result = await pool.query(is_creator, [groupId, 'creator']);
    if (result[0][0].user_id !== userId) {
      return res.status(400).json({ error: 'You Can\'t Access the Data!' });
    }

    // users contain all pending user
    const sql = `SELECT U.id id, U.name name, U.picture picture, G.status status
              FROM user_groups G INNER JOIN users U on G.user_id = U.id
              WHERE G.status = ?`;
    const results = await pool.query(sql, ['pending']);
    const users = results[0];
    // console.log('users: ' + users);

    return res.json({ data: { users } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* agree join group */
// endpoint: /groups/:group_id/member/:user_id/agree
async function agreeMember (req, res) {
  const groupId = parseInt(req.params.group_id);
  const requesterId = parseInt(req.params.user_id);
  const userId = getUserId(res);

  try {
    // check user is creator of the group & not request yourself
    const is_creator = 'SELECT user_id FROM user_groups WHERE group_id = ? AND status = ?';
    const result = await pool.query(is_creator, [groupId, 'creator']);
    if (result[0][0].user_id !== userId || userId === requesterId) {
      return res.status(400).json({ error: 'You Can\'t Agree the Request!' });
    }

    // agree member: update
    const sql = 'UPDATE user_groups SET status = ? WHERE user_id = ? AND group_id = ?';
    await pool.query(sql, ['member', requesterId, groupId]);

    return res.json({ data: { user: { id: requesterId } } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* post in group */
// endpoint: /groups/:group_id/post
async function createGroupPost (req, res) {
  const { context } = req.body;
  const groupId = parseInt(req.params.group_id);
  const userId = getUserId(res);

  try {
    // check user is already in this group
    const is_exist = `SELECT EXISTS( 
                          SELECT 1 FROM user_groups WHERE group_id = ? AND user_id = ? AND NOT status = ?
                      ) AS result`;
    const result = await pool.query(is_exist, [groupId, userId, 'pending']); // not a pending member
    if (result[0][0].result === 0) return res.status(400).json({ error: 'You Can\'t Post in Group!' });

    // create post
    const date = getDateFormat();
    const sql = 'INSERT INTO group_posts (user_id, context, group_id, created_at) VALUE (?, ?, ?, ?)'
    const insert = await pool.query(sql, [userId, context, groupId, date]);

    const data = {
      group: {
        id: groupId
      },
      user: {
        id: userId
      },
      post: {
        id: insert[0].insertId
      }
    }

    return res.json({ data });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* get group post */
// endpoint: /groups/:group_id/posts
async function getGroupPost (req, res) {
  const groupId = req.params.group_id;
  const userId = getUserId(res);

  try {
    // check user is in this group
    const is_exist = `SELECT EXISTS( 
                          SELECT 1 FROM user_groups WHERE group_id = ? AND user_id = ? AND NOT status = ?
                      ) AS result`;
    const result = await pool.query(is_exist, [groupId, userId, 'pending']); // not a pending member
    if (result[0][0].result === 0) return res.status(400).json({ error: 'You Can\'t Get Post!' });

    // get all posts in this group (latest post on top)
    const sql = `SELECT P.*, U.name name, U.picture picture
                  FROM group_posts P INNER JOIN users U on P.user_id = U.id
                  WHERE P.group_id = ? 
                  ORDER BY P.created_at DESC`;
    const results = await pool.query(sql, [groupId]);
    // const posts = results[0];
    const posts = results[0].map(row => {
      const { id, user_id, created_at, context, like_count, comment_count, picture, name} = row;
      return {
        id,
        user_id,
        created_at,
        context,
        is_liked: false,
        like_count,
        comment_count,
        picture,
        name
      }
    })
    // const posts = [];

    return res.json({ data: { posts } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

module.exports = {
  createGroup,
  deleteGroup,
  joinGroup,
  getPendingMember,
  agreeMember,
  createGroupPost,
  getGroupPost
}
