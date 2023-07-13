require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./database.js');
const port = 80;

const app = express();
app.use(express.json()); // use middleware json

/* signup route */
function signUp(req, res) {

    const {name, email, password} = req.body;

    // check request header
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ error: 'Invalid content type. Only application/json is accepted.' });
      }

    // validate request body
    if(!name || !email || !password){
        return res.status(400).json({ error: 'Client Error Response' });
    }

    if(!validateEmail(email)){
        return res.status(400).json({ error: 'Invalid Email Format' });
    }
    
    // check email exists or not
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) =>{
        if(error){ // server error
            console.error(error);
            return res.status(500).json({ error: 'Server Error Response' });
        }
        if(results.length > 0) // email exists
            return res.status(403).json({ error: 'Email Already Exists' });


        // hash password
        const hashPassword = await bcrypt.hash(password, 10);
        const insertData = {
            name,
            provider: 'native',
            email,
            password: hashPassword
        }
        
        // insert new user into database
        pool.query('INSERT INTO users SET ?', insertData, (error, result) => {
            if(error){
                console.error(error);
                return res.status(500).json({ error: 'Server Error Response' });
            }

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
            const data = { 
                id: userId,
                provider: 'native', 
                name, 
                email, 
                picture: "https://schoolvoyage.ga/images/123498.png"
            };

            const response = {
                access_token: token
                , data
            };

            return res.json(response);
        });
    });
}

function validateEmail(email){
    // regular expression:
    // [^] start , [$] end 
    // [\w-] all number, letter, _ , -
    // [+] 1 or more , [*] 0 or more
    // {at least , more than}
    const pattern = /^[\w-]+(\.[\w-]+)*@[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*(\.[a-zA-Z]{2,})/;
    // test
    return pattern.test(email);
}

module.exports = {signUp};