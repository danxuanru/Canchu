/* eslint-disable semi */
const { createClient } = require('redis');
const { getProfileData } = require('../Model/profileModel')
const client = createClient();

// set cache data
async function setCache (cacheKey, cacheData) {
  await client.connect();
  await client.set(cacheKey, cacheData);
  await client.disconnect();
}

// delete cahce data
async function deleteCache (cacheKey) {
  await client.connect();
  await client.del(cacheKey);
  await client.disconnect();
}

// get cache data
async function getCache (cacheKey) {
  await client.connect();
  await client.get(cacheKey);
  await client.disconnect();
}

// get user profile data
async function cacheUserProfileData (userId, visterId) {
  try {
    await client.connect();
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
      await client.set(userId, JSON.stringify(profileData));
      console.log('Data stored in cache.');

      return profileData;
    }
  } catch (error) {
    console.error('Error while caching data: ', error);
    return null;
  } finally {
    await client.disconnect();
  }
}

module.exports = {
  cacheUserProfileData
}
