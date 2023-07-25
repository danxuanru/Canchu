/* eslint-disable semi */
require('dotenv').config();
const express = require('express');
const redis = require('redis');
const client = redis.createClient(); // port 6379
const { promisify } = require('util');
const { getProfileData } = require('./Model/profileModel');

const app = express();
app.use(express.json());

client.on('connect', () => console.log('Redis Connect Successfully!'));
client.on('error', err => console.log('Redis Client Error', err));
await client.connect();

// promise 包裝 redis 方法 , 以支援 async / await
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

async function cacheUserProfileData (visterId, userId) {
  try {
    // check cache 是否已經有 user 的 profile data
    const cachedData = await getAsync(userId);
    if (cachedData) {
      console.log('data found in cache');
      return JSON.parse(cachedData);
    } else {
      console.log('Data not found in cache. Retrieving from the database');
      // get data from database
      const profileData = await getProfileData(visterId, userId);

      // data write into cache
      // expire time 3600s = 1hr
      await setAsync(userId, JSON.stringify(profileData), 'EX', 3600);
      console.log('Data stored in cache.');
      return profileData;
    }
  } catch (error) {
    console.error('Error while caching data: ', error);
    return null;
  }
}

async function clearCache (userId) {
  try {
    // delete user data in cache
    await delAsync(userId);
    console.log('Cache cleared for user: ', userId);
  } catch (error) {
    console.error('Error while clearing cache', error);
  }
}

module.exports = {
  cacheUserProfileData,
  clearCache
}
