import IORedis from 'ioredis'

let redis: IORedis

export function useRedis() {
  if (!redis) {
    const { redis: redisConfig } = useRuntimeConfig()
    redis = new IORedis({
      ...redisConfig,
      maxRetriesPerRequest: null,
    })
  }

  return redis
}
