/* eslint-disable semi */
require('dotenv').config();
const express = require('express');
const Redis = require('ioredis');
const client = new Redis(); // port 6379
const { getProfileData } = require('../Model/profileModel');

const app = express();
app.use(express.json());

const cacheUserProfileData = async (visterId, userId) => {
  try {
    // check cache 是否已經有 user 的 profile data
    console.log(visterId + ' get ' + userId + ' profile cache data');
    const cachedData = await client.get(userId);

    if (cachedData) {
      console.log('data found in cache');
      console.log('data: ' + cachedData);
      return JSON.parse(cachedData);
    } else {
      console.log('Data not found in cache. Retrieving from the database');
      // get data from database
      const profileData = await getProfileData(visterId, userId);

      // data write into cache
      // expire time 3600s = 1hr
      await client.setex(userId, 3600, JSON.stringify(profileData));
      console.log('Data stored in cache.');

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
  } catch (error) {
    console.error('Error while clearing cache', error);
  }
}

module.exports = {
  cacheUserProfileData,
  clearCache
}
