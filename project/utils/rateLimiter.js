/* eslint-disable semi */
// const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const client = new Redis(); // port 6379
const limit = 3;

async function rateLimiter (req, res) {
  try {
    // get ip from header
    // console.log(req.connection.remoteAddress + ' / ' + req.headers['x-forward-for'] + ' / ' + req.headers['x-real-ip']);
    const ip = req.headers['x-real-ip'] || req.headers['x-forward-for'] || req.connection.remoteAddress;
    // get ip count & remain ttl
    const ipKey = `rateLimiter:ip#${ip}`;
    console.log(ipKey);
    const requestCount = parseInt(await client.get(ipKey));
    // const ttl = await client.ttl(ipKey);
    if (requestCount) {
      if (requestCount >= limit) {
        // add blacklist
        window.alert('請求過多了 請稍後再試!');
        return res.status(429).json('請求過多了 請稍後再試!');
      }
      console.log(`第${requestCount + 1}訪問 / s`);
      // await client.setex(ipKey, 1, parseInt(requestCount) + 1);
      await client.incr(ipKey);
    } else { // no request in this second
      await client.set(ipKey, 1, 'EX', 1);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = { rateLimiter };
