/* eslint-disable semi */
// const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const { clearCache } = require('./cache');
// const { getUserId } = require('./utils');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

const client = new Redis(); // port 6379
const limit = 3;

async function rateLimiter (req, res, next) {
  const token = req.headers.authorization;

  // Verify the token and extract user information (userId)
  const decodedToken = jwt.verify(token, secretKey);
  const userId = decodedToken.id;

  try {
    // get ip from header
    const ip = req.headers['x-real-ip'] || req.headers['x-forward-for'] || req.connection.remoteAddress;

    // get ip count & block or not
    const ipKey = `rateLimiter:ip#${ip}`;
    const blockKey = `rateLimiter:block#${ip}`;

    const blockRequest = await client.get(blockKey);
    let requestCount = await client.get(ipKey);

    if (!blockRequest && requestCount) {
      requestCount = parseInt(requestCount);

      if (requestCount >= limit) {
        // add to blocklist
        client.set(blockKey, 1, 'EX', 10);
        client.del(ipKey); // delete ipKey

        // const userId = getUserId();
        console.log(userId);
        await clearCache(userId);

        window.alert('request too much, please try later!!');

        return res.status(429).json({ error: `${ipKey} request too much!!` });
      }
      // await client.setex(ipKey, 1, parseInt(requestCount) + 1);
      await client.incr(ipKey);

      // Call next() to proceed to the next middleware or route handler
      next();
    } else if (blockRequest) {
      return res.status(429).json({ error: 'try later!!' })
    } else { // no request in this second
      await client.set(ipKey, 1, 'EX', 1);
      next();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = { rateLimiter };
