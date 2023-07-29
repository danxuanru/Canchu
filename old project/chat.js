/* eslint-disable no-tabs */
/* eslint-disable camelcase */
/* eslint-disable semi */
const pool = require('./database');
const { getDateFormat, getUserId } = require('./utils/utils');

/* send message */
// endpoint: /chat/:user_id
async function sendChat (req, res) {
  const { message } = req.body;
  const receiverId = req.params.user_id;
  const userId = getUserId(res);

  // check user is not heself
  if (userId === receiverId) return res.status(400).json({ error: 'You Can\'t Send Message to Yourself!' });
  // check receiver is exists

  try {
    // get chatroom
    const getChatId = `SELECT (
													SELECT chat_id FROM messages 
											  	WHERE (user_id = ? AND receiver_id = ?) OR (receiver_id = ? AND user_id = ?)
													LIMIT 1
												) AS chat_id,
												MAX(chat_id)+1 as new_chat 
												FROM messages`;
    const result = await pool.query(getChatId, [userId, receiverId, userId, receiverId]);
    // console.log(result);
    const chatId = (result[0].chat_id ? result[0].chat_id : result[0].new_chat) ? (result[0].chat_id ? result[0].chat_id : result[0].new_chat) : 1;
    console.log('chat id:' + chatId);

    // send a message
    const date = getDateFormat();
    const sql = 'INSERT INTO messages (message, user_id, receiver_id, created_at, chat_id) VALUE (?,?,?,?,?)'
    const insert = await pool.query(sql, [message, userId, receiverId, date, chatId]);

    const messageId = insert[0].insertId;

    return res.json({ data: { message: { id: messageId } } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

/* get message */
async function getChat (req, res) {
  const chatterId = parseInt(req.params.user_id);
  const { cursor } = req.query;

  const userId = getUserId(res);

  try {
    // get total messages
    const total_messages = await pool.query('SELECT COUNT(*) as total FROM messages');
    // cursor decode and convert to number
    const cursor_number = cursor ? Buffer.from(cursor, 'base64').toString() : total_messages[0][0].total + 1;
    console.log(cursor_number);
    // get chatter data {id, name, picture} or inner join to chat data
    // const userSQL = 'SELECT name, picture FROM users WHERE id = ?';
    // const userData = await pool.query(userSQL, [chatterId]);
    // const { name, picture } = userData[0][0];
    // const user = {
    //   id: chatterId,
    //   name,
    //   picture
    // }
    const limit = 5;

    // get chat data
    const chatSQL = `SELECT chat_id FROM messages 
											WHERE (user_id = ? AND receiver_id = ?) OR 
											(receiver_id = ? AND user_id = ?) LIMIT 1`
    const getChatId = await pool.query(chatSQL, [userId, chatterId, userId, chatterId]);
    const chatId = getChatId[0][0].chat_id;
    // console.log(chatId);

    const sql = `SELECT M.id, M.message, M.created_at, U.id as user_id, U.name, U.picture
									FROM messages M 
									INNER JOIN users U ON M.user_id = U.id
									WHERE M.chat_id = ?
									AND M.id < ? 
									ORDER BY M.id DESC LIMIT ?`;
    const results = await pool.query(sql, [chatId, cursor_number, limit + 1]);

    // get number of chat
    const number_of_chat = results[0].length > limit ? limit : results[0].length;

    const messages = results[0].slice(0, number_of_chat).map(result => {
      const { id, message, created_at, user_id, name, picture } = result;
      return {
        id,
        message,
        created_at,
        user: {
          id: user_id,
          name,
          picture
        }
      }
      // messages.push(chat);
    })
    // results[0][number_of_chat - 1] = last chat of this page
    const next_cursor = results[0][number_of_chat - 1]
      ? Buffer.from((results[0][number_of_chat - 1].id).toString()).toString('base64')
      : null

    return res.json({ data: { messages, next_cursor } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

module.exports = {
  sendChat,
  getChat
}
