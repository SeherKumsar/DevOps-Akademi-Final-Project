const redis = require('redis');

const redisClient = redis.createClient({
    // host: "redis-service",
    host: "redis",
    port: 6379,
});
    
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.log('Redis error: ', err);
});

module.exports = { redisClient };