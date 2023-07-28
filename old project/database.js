/* eslint-disable semi */
// const mysql = require('mysql');
const mysql2 = require('mysql2/promise');
require('dotenv').config();
const db = process.env.NODE_ENV === 'test' ? process.env.DB_TEST : process.env.DB;

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: db
})

module.exports = pool;
