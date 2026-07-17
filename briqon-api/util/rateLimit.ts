import { Ratelimit } from "@upstash/ratelimit";

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,

  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimit = new Ratelimit({
  redis,
  // 10 requests per hour
  limiter: Ratelimit.slidingWindow(10, "1 h"),

  prefix: "briqon",
});
