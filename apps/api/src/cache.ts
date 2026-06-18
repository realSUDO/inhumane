import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on("error", () => {}); // Silently handle - cache is optional
redis.connect().catch(() => {});

const TTL = { emails: 120, calendar: 60, threads: 300, messages: 300 }; // seconds

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },

  async set(key: string, data: any, ttlSec?: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(data), "EX", ttlSec || 120);
    } catch {}
  },

  async del(key: string): Promise<void> {
    try { await redis.del(key); } catch {}
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    } catch {}
  },

  // Scoped helpers
  emailsKey: (userId: string, label: string, page?: string) => `emails:${userId}:${label}:${page || "1"}`,
  calendarKey: (userId: string, timeMin: string, timeMax: string) => `cal:${userId}:${timeMin}:${timeMax}`,
  threadsKey: (userId: string) => `threads:${userId}`,
  messagesKey: (userId: string, threadId: string) => `msgs:${userId}:${threadId}`,

  TTL,
};
