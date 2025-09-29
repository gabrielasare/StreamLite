import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL!)


export async function rateLimit(id: string, limit = 20, windowSec = 60) {
    const key = `rl:${id}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSec)
    return count <= limit
}