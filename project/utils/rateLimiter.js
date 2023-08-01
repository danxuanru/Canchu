const rateLimit = require('express-rate-limit');

// create a client

const limiter = rateLimit({
  // config
  windowMs: 1 * 60 * 1000, // time
  max: 10, // request limit
  message: '請求過多了 請稍後再試!'
});

module.exports = { limiter };
