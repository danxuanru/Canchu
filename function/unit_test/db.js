/* eslint-disable semi */
require('dotenv').config();
const { Client } = require('pg');
const db = process.env.NODE_ENV === 'test' ? process.env.DB_TEST : process.env.DB;

const client = new Client({
    connectionString: `postgresql://localhost/${db}`
});

client.connect();

module.exports = client;
