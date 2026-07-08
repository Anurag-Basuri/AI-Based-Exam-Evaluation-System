import { Redis } from '@upstash/redis';
import NodeCache from 'node-cache';

// ── Upstash Redis + In-Memory Fallback Cache ────────────────────
// Attempts to connect to Upstash Redis. If unavailable (no env vars,
// network failure, free-tier limit), falls back to node-cache silently.
// The public API is identical regardless of backend.

let redis = null;
let useRedis = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
	try {
		redis = new Redis({
			url: process.env.UPSTASH_REDIS_REST_URL,
			token: process.env.UPSTASH_REDIS_REST_TOKEN,
		});
		useRedis = true;
		console.log('[CACHE] ✅ Connected to Upstash Redis');
	} catch (err) {
		console.warn(
			'[CACHE] ⚠️ Upstash Redis init failed, falling back to in-memory:',
			err.message,
		);
	}
}

// Fallback: local in-memory cache (same as original implementation)
const localCache = new NodeCache({
	stdTTL: 300,
	checkperiod: 60,
	useClones: false,
});

if (!useRedis) {
	console.log('[CACHE] 📦 Using in-memory cache (node-cache)');
}

// Get a value from cache, or fetch it and cache the result.
export const getCachedOrFetch = async (key, ttlSeconds, fetchFn) => {
	if (useRedis) {
		try {
			const cached = await redis.get(key);
			if (cached !== null && cached !== undefined) return cached;

			const data = await fetchFn();
			// Store as JSON string; @upstash/redis auto-serializes, but we
			// are explicit to avoid edge-cases with non-plain objects
			await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
			return data;
		} catch (err) {
			console.warn(
				`[CACHE] Redis read/write error for key "${key}", falling back:`,
				err.message,
			);
		}
	}

	// Fallback path (node-cache)
	const cached = localCache.get(key);
	if (cached !== undefined) return cached;

	const data = await fetchFn();
	localCache.set(key, data, ttlSeconds);
	return data;
};

// Invalidate a specific cache key.
export const invalidate = async key => {
	if (useRedis) {
		try {
			await redis.del(key);
		} catch (err) {
			console.warn(`[CACHE] Redis invalidate error for "${key}":`, err.message);
		}
	}
	localCache.del(key);
};

// Invalidate all keys matching a prefix.
export const invalidateByPrefix = async prefix => {
	if (useRedis) {
		try {
			let cursor = 0;
			do {
				const result = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
				cursor = result[0];
				const keys = result[1];
				if (keys.length > 0) {
					await redis.del(...keys);
				}
			} while (cursor !== 0);
		} catch (err) {
			console.warn(`[CACHE] Redis prefix invalidation error for "${prefix}":`, err.message);
		}
	}
	// Also clear from local cache
	const localKeys = localCache.keys().filter(k => k.startsWith(prefix));
	if (localKeys.length > 0) localCache.del(localKeys);
};

// Flush the entire cache.
export const flushAll = async () => {
	if (useRedis) {
		try {
			await redis.flushall();
		} catch (err) {
			console.warn('[CACHE] Redis flushAll error:', err.message);
		}
	}
	localCache.flushAll();
};

// Get cache stats for monitoring.
export const getStats = () => ({
	backend: useRedis ? 'upstash-redis' : 'node-cache',
	local: localCache.getStats(),
});

export default { getCachedOrFetch, invalidate, invalidateByPrefix, flushAll, getStats };
