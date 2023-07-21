/* eslint-disable semi */
// const mysql = require('mysql');
const mysql2 = require('mysql2/promise');
require('dotenv').config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: 'Canchu'
})

module.exports = pool;
