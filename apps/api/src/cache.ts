import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  commandTimeout: 1000,
  retryStrategy: (times) => Math.min(times * 100, 1000),
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
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", "100");
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch {}
  },

  // Scoped helpers
  emailsKey: (userId: string, label: string, page?: string) => `emails:${userId}:${label}:${page || "1"}`,
  calendarKey: (userId: string, timeMin: string, timeMax: string) => `cal:${userId}:${timeMin}:${timeMax}`,
  threadsKey: (userId: string) => `threads:${userId}`,
  messagesKey: (userId: string, threadId: string) => `msgs:${userId}:${threadId}`,

  // Optimistic blocking helpers
  async blockId(userId: string, id: string): Promise<void> {
    try {
      const key = `blocked:${userId}`;
      await redis.sadd(key, id);
      await redis.expire(key, 300); // 5 minutes TTL
    } catch {}
  },

  async getBlockedIds(userId: string): Promise<string[]> {
    try {
      return await redis.smembers(`blocked:${userId}`) || [];
    } catch {
      return [];
    }
  },

  // Usage / Beta Limits
  async incrementUsage(userId: string, type: "messages" | "actions"): Promise<number> {
    try {
      return await redis.incr(`usage:${userId}:${type}`);
    } catch { return 0; }
  },

  async getUsage(userId: string, type: "messages" | "actions"): Promise<number> {
    try {
      const val = await redis.get(`usage:${userId}:${type}`);
      return val ? parseInt(val, 10) : 0;
    } catch { return 0; }
  },

  TTL,
};
