/* eslint-disable semi */
// 3A principle:
// Arrange 建立物件
// Act 操作物件
// Assert 驗證

// return data:{
//   access_token,
//   user obj: { id, provider(native), name, email, picture }
// }

// token's payload = {id, email, name}
// data write into database
process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../router');
const pool = require('../database');

// [valid] seccess signup - return jwt & correct data & status(200)
describe('POST /api/1.0/users/signup', () => {
  test('sign-up success - return user data', async () => {
    const userData = {
      name: 'test',
      email: 'test@test.com',
      password: 'test'
    };
    const response = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data).toHaveProperty('user');
    // expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user.name).toBe(userData.name);
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.provider).toBe('native');
    // expect(response.body.data.user.name.picture).toBeNull();
    expect(response.statusCode).toBe(200);
    // token正確性???
  });
});

// [valid] missing data sign-up - return status(400)
describe('POST /api/1.0/users/signup', () => {
  test('data missing - return status code 400', async () => {
    const userData = {
      name: 'test22',
      email: 'test22@test.com'
    }
    const response = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    expect(response.statusCode).toBe(400);
  });
});

// [valid] wrong email format mistake - return status(400)
describe('POST /api/1.0/users/signup', () => {
  test('wrong email format - return status code 400', async () => {
    const userData = {
      name: 'test22',
      email: 'test@22@test.com',
      password: 'test'
    }
    const response = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    expect(response.statusCode).toBe(400);
  });
});

// [valid] duplicate registration - return status(403)
describe('POST /api/1.0/users/signup', () => {
  test('duplicate registration - return status code 403', async () => {
    const userData = {
      name: 'test',
      email: 'test@test.com',
      password: 'testtest'
    }
    const response = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    expect(response.statusCode).toBe(403);
  });
});

// afterAll - close connection & delete all data in table
afterAll( (done) => {
  app.listen(80).close(done);
	console.log('測試結束，伺服器已關閉!')
});

afterAll(async () => {
	await pool.query('DELETE FROM users');
});
