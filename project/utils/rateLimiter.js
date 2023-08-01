/* eslint-disable semi */
// const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const client = new Redis(); // port 6379
const limit = 10;

async function rateLimiter(req, res) {
  // get ip from header
  console.log(req.ip + ' / ' + req.headers['x-forward-for'] + ' / ');
  const ip = req.headers['x-forward-for'] || req.ip;
  // get ip count & remain ttl
  const ipKey = `rateLimiter:ip#${ip}`;
  console.log(ipKey);
  const requestCount = client.get(ipKey);
  const ttl = client.ttl(ipKey)
  if (requestCount) {
    if (requestCount >= limit) {
      // add blacklist
      console.log('請求過多了 請稍後再試!');
    }
    console.log(`第${requestCount + 1}訪問 / s`);
    client.setex(ipKey, ttl, requestCount + 1);
  } else { // no request in this second
    client.set(ipKey, 1, 'EX', 1);
  }
};

module.exports = { rateLimiter };
