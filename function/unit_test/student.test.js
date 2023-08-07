/* eslint-disable semi */
process.env.NODE_ENV = 'test';
const db = require('./db');
const request = require('supertest');
const app = require('./app');

// DB操作:
// beforeAll test: create table
// beforeEach test: seed a couple of data to table
// afterEach test: delete all data in table
// afterAll test: drop table & close database connection

describe('GET / ', () => {
  test('It should respond with a array of students', async () => {
    const response = await request(app).get('/students'); // request([api]).[method]([router])
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.statusCode).toBe(200);
  });
});

describe('Post /students', () => {
  test('It responds with the newly created student', async () => {
    const newStudent = await request(app)
      .post('/student')
      .send({
        name: 'New Student'
      });

    // make sure we add it correctly
    expect(newStudent.body).toHaveProperty('id');
    expect(newStudent.body.name).toBe('New Student');
    expect(newStudent.statusCode).toBe(200);
  });
});
