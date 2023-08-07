const express = require('express');
const app = express();
const db = require('./db');
const students = ['Elie', 'Matt', 'Joel', 'Michael'];
const studentRouters = require('./student');

app.use(express.json());
app.use('/students', studentRouters);


app.get('/', (req, res) => {
  return res.json(students);
});

module.exports = app;