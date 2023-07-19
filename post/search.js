require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const { getFriendship, getLikeOrNot, getUserName } = require('./model.js');

async function userSearch (req,res) {
    // search?keyword=...
    const keyword = req.query.keyword;
    const token = res.locals.token;
    const user = jwt.verify(token, secretKey);
    const user_id = user.id
    
    console.log(keyword);
    if(!keyword){
        return res.status(400).json({error: 'No keyword'});
    }

    const query = 'SELECT * FROM users WHERE `name` LIKE ?';
    const results = await pool.query(query, [`%${keyword}%`]);
    
    console.log(results[0]);

    let users = [];
    for(let i=0; i<results[0].length; i++){
        
        // friendship with user
        let friend_id = results[0][i].id;
        let friendship = await getFriendship(user_id, friend_id);
        // console.log(result[0]);
       
        const search_obj = {
            id: friend_id,
            name: results[0][i].name,
            picture: results[0][i].picture,
            friendship
        }
        users.push(search_obj);
    }

    return res.json({data: {users}});
}

/* search post */
async function postSearch(req, res) {
	
  try {
		const {user_id, cursor} = req.query;
    const token = res.locals.token;
    const searcher = jwt.verify(token, secretKey);
    const searcher_id = searcher.id
		console.log(user_id);
		
    // cursor decode and convert to number
		const cursor_number = cursor ? Buffer.from(cursor, 'base64').toString() : null;
		// console.log(cursor_number);

    // create query 
    let query = 'SELECT * FROM posts';
    let params = [];
		const limit = 10;

    if(user_id && cursor) {
        query += ' WHERE name = ? AND id > ?';
        params.push(await getUserName(user_id), cursor_number);
    } else if(cursor) {
        query += ' WHERE id > ?';
        params.push(cursor_number);
    } else if(user_id) {
			query += ' WHERE name = ?';
        params.push(await getUserName(user_id));
		}
		query += ' ORDER BY id ASC LIMIT ?';
		params.push(limit+1);  // query 1 more data
		console.log(query);
    const results = await pool.query(query, params);
		//console.log(results[0]);

    let posts = [];
		const number_of_posts = results[0].length < 5 ? results[0].length : limit;  // number of posts <= limit

    for(let i=0; i<number_of_posts; i++){
      
			// const [{id, created_at, context, like_count, comment_count, picture, name}] = results[0];
			const postData = results[0][i];
			// console.log(postData)
			const is_liked = await getLikeOrNot(postData.id, searcher_id);
			// console.log(is_liked);

      const post_obj = {
        id: postData.id,
        created_at: postData.created_at,
        context: postData.context,
        is_liked,
        like_count: postData.like_count,
        comment_count: postData.comment_count,
        picture: postData.picture,
        name: postData.name
      }
      posts.push(post_obj);
    }
		console.log(results[0]);

		// encode next_cursor
		// next_cursor = last post in the current page
		console.log('last post:' + results[0][number_of_posts-1].id); // last post in current page
		console.log('next post:' + results[0][number_of_posts]);  // next post after current page
		const next_cursor = results[0][number_of_posts] ? 
												Buffer.from((results[0][number_of_posts-1].id).toString()).toString('base64') : null;
  
    return res.json({data: {posts, next_cursor}});

	} catch(error) {
		console.error('Error: ', error);
    return res.status(500).json({ error: 'Server Error'});
	}
}
  
module.exports = { userSearch, postSearch };