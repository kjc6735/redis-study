import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected');
  } catch (error) {
    console.error('Redis connection error', error);
    // 연결 실패 시에도 예외를 던지지 않음
  }
};

export { redisClient, connectRedis };
