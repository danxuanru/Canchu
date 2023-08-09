/* eslint-disable semi */
const jwt = require('jsonwebtoken');
const secretKey = `${process.env.JWT_SECRET_KEY}`;

function getDateFormat () {
  const date = new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate());
  const hours = String(date.getHours());
  const minutes = String(date.getMinutes());
  const seconds = String(date.getSeconds());

  console.log(date.toLocaleString('sv')); // 將格式轉為瑞士格式 YYYY-MM-DD HH:MM:SS
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function getUserId (res) {
  const token = res.locals.token;
  const user = jwt.verify(token, secretKey);
  return user.id;
}

module.exports = { getDateFormat, getUserId };
