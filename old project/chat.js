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
												) AS chat_id,
												MAX(chat_id)+1 as new_chat 
												FROM messages`;
    const result = await pool.query(getChatId, [userId, receiverId, receiverId, userId]);
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
  const chatterId = req.params.user_id;
  const cursor = req.query;

  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  const userId = user.id;

  try {
    // cursor decode and convert to number
    const cursor_number = cursor ? Buffer.from(cursor, 'base64').toString() : 0;

    // get chatter data {id, name, picture} or inner join to chat data

    const user = {
      id: chatterId,
      name,
      picture
    }
    // get chat data

    const messages = [];
    // for () {
    //     const { id, message, created_at } = result[0][i];
    //     chat = {
    //         id,
    //         message,
    //         created_at,
    //         user
    //     }
    //     messages.push(chat);
    // }
    console.log(messages);

    return res.json({ data: { messages } });
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

module.exports = {
  sendChat,
  getChat
}
