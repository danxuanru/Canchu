/* eslint-disable linebreak-style */
const jwt = require('jsonwebtoken');

const secretKey = `${process.env.JWT_SECRET_KEY}`;

// eslint-disable-next-line consistent-return
async function authenticateToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header) { return res.status(401).json({ error: 'No token provided' }); }

  const token = header.split(' ')[1];

  // eslint-disable-next-line consistent-return
  jwt.verify(token, secretKey, (err, user) => {
    if (err) { return res.status(403).json({ error: 'Invalid Token' }); }

    // attach the user infomation to the request obj
    req.user = user;
    res.locals.token = token;
    next();
  });
}

module.exports = { authenticateToken };
