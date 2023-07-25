/* eslint-disable semi */
require('dotenv').config();
const express = require('express');
const Redis = require('ioredis');
const client = new Redis(); // port 6379
const { getProfileData } = require('./Model/profileModel');

const app = express();
app.use(express.json());

// client.on('connect', () => console.log('Redis Connect Successfully!'));
// client.on('error', err => console.log('Redis Client Error', err));
// await client.connect();

// promise 包裝 redis 方法 , 以支援 async / await
// const getAsync = promisify(client.get).bind(client);
// const setAsync = promisify(client.set).bind(client);
// const delAsync = promisify(client.del).bind(client);

const cacheUserProfileData = async (visterId, userId) => {
  // connect cache
  // await client.connect();

  try {
    // check cache 是否已經有 user 的 profile data
    const cachedData = await client.get(userId);

    if (cachedData) {
      console.log('data found in cache');
      return JSON.parse(cachedData);
    } else {
      console.log('Data not found in cache. Retrieving from the database');
      // get data from database
      const profileData = await getProfileData(visterId, userId);

      // data write into cache
      // expire time 3600s = 1hr
      await client.setex(userId, 3600, JSON.stringify(profileData));
      console.log('Data stored in cache.');

      // disconnect
      // await client.disconnect();

      return profileData;
    }
  } catch (error) {
    console.error('Error while caching data: ', error);
    return null;
  }
}

const clearCache = async (userId) => {
  // await client.connect();

  try {
    // delete user data in cache
    await client.del(userId);
    console.log('Cache cleared for user: ', userId);
    // await client.disconnect();
  } catch (error) {
    console.error('Error while clearing cache', error);
    // await client.disconnect();
  }
}

module.exports = {
  cacheUserProfileData,
  clearCache
}
