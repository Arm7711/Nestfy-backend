import Redis from 'ioredis';
import 'dotenv/config'


const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    database: process.env.REDIS_DATABASE,
    password: process.env.REDIS_PASSWORD
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

export default redis;