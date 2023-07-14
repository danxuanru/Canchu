require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./database.js');
const port = 5000;
const DBport = process.env.DB_PORT;


const app = express();
app.use(express.json()); // use middleware json


app.post('/api/1.0/users/signin', async (req, res) => {
    try {
        const {provider, email, password} = req.body;
        
        // check request header
        if (req.headers['content-type'] !== 'application/json') {
            return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
        }
        

        if (provider === 'native') {
            // data missing
            if(!email | !password) 
                return res.status(400).json({ error: 'Incomplete Data!' });

            // check email, password is already exists in database
            // const userData = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
            
            pool.query('SELECT * FROM users WHERE email = ?', email, async (error, results) => {

                if(results.length === 0)
                    return res.status(403).json({ error: 'Email Does Not Found!'});

                // password authentication
                const userData = results[0];

                const passwordMatch = await bcrypt.compare(password, userData.password);
                    
                if(!passwordMatch)
                    return res.status(403).json({ error: 'Incorrect Password'});
            

                const token = jwt.sign({id: userData.id, name: userData, email: userData.email}, `${process.env.JWT_SECRET_KEY}`);
                
                // response
                const user = {
                    id: userData.id,
                    provier: userData.provider,
                    name: userData.name,
                    email: userData.email,  
                    picture: userData.picture
                }
                return res.json({access_token: token, data: user});

            });
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
            return res.status(403).json({ error: 'Wrong provider'});
        }

    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({ error: 'Server Error'});
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});