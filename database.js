// const mysql = require('mysql');
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: 'Canchu'
});

// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PWD,
//     database: 'Canchu'
// });
//
// connection.connect((err) => {
//     if (err) throw err;
//     console.log('Connected to MySQL database!');
// });


module.exports = pool;