import NodeCache from 'node-cache';

// ── In-Memory Cache ─────────────────────────────────────────────
// Lightweight wrapper around node-cache.
// Can be swapped for Redis later without touching callers.

const cache = new NodeCache({
	stdTTL: 300, // Default: 5 minutes
	checkperiod: 60, // Cleanup expired keys every 60s
	useClones: false, // Return references (faster, but callers must not mutate)
});

/**
 * Get a value from cache, or fetch it and cache the result.
 * @param {string} key - Cache key
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {Function} fetchFn - Async function that returns the data
 * @returns {Promise<*>} Cached or freshly fetched data
 */
export const getCachedOrFetch = async (key, ttlSeconds, fetchFn) => {
	const cached = cache.get(key);
	if (cached !== undefined) return cached;

	const data = await fetchFn();
	cache.set(key, data, ttlSeconds);
	return data;
};

/**
 * Invalidate a specific cache key.
 */
export const invalidate = (key) => {
	cache.del(key);
};

/**
 * Invalidate all keys matching a prefix.
 * Useful for bulk invalidation (e.g., all exam-related keys).
 */
export const invalidateByPrefix = (prefix) => {
	const keys = cache.keys().filter(k => k.startsWith(prefix));
	if (keys.length > 0) cache.del(keys);
};

/**
 * Flush the entire cache.
 */
export const flushAll = () => {
	cache.flushAll();
};

/**
 * Get cache stats for monitoring.
 */
export const getStats = () => cache.getStats();

export default cache;
