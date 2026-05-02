import axios from 'axios';
import { isTokenExpired, getToken, removeToken, setToken, decodeToken } from '../utils/handleToken.js';

// ═══════════════════════════════════════════════════════════════════
// BASE CONFIG
// ═══════════════════════════════════════════════════════════════════

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** Axios instance for authenticated requests. */
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 15000,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
});

/** Axios instance for public (unauthenticated) requests. */
const publicClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 15000,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
});

// ═══════════════════════════════════════════════════════════════════
// CENTRALIZED ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════

/**
 * Unified API error class used across all service files.
 */
export class ApiError extends Error {
	constructor(message, status = 0, data = null) {
		super(message || 'Request failed');
		this.name = 'ApiError';
		this.status = status;
		this.data = data;
	}
}

/**
 * Normalize any Axios error into a clean ApiError.
 */
export const parseAxiosError = err => {
	if (!err) return new ApiError('Unknown error');
	if (err?.name === 'CanceledError') return new ApiError('Request canceled', 499);

	const status = err?.response?.status ?? 0;
	const data = err?.response?.data;
	const message =
		data?.message ||
		data?.error ||
		err?.message ||
		(status
			? `Request failed with status ${status}`
			: 'Network error — check your connection.');
	return new ApiError(message, status, data);
};

/**
 * Generic wrapper for any async service function.
 * Unwraps ApiResponse shapes (data.data) and handles pagination objects.
 */
export const safeApiCall = async (fn, ...args) => {
	try {
		const res = await fn(...args);
		const responseData = res?.data?.data ?? res?.data ?? res;
		// Preserve paginated response objects that have an `items` property
		if (
			responseData &&
			typeof responseData === 'object' &&
			Object.prototype.hasOwnProperty.call(responseData, 'items')
		) {
			return responseData;
		}
		return responseData;
	} catch (e) {
		throw parseAxiosError(e);
	}
};

// ═══════════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════

// Attach token to authenticated requests
apiClient.interceptors.request.use(config => {
	const { accessToken } = getToken();
	if (accessToken) {
		if (isTokenExpired(accessToken)) {
			// Don't immediately invalidate — let the response interceptor
			// try a refresh first. Just skip attaching the expired token.
			// The request will likely 401, triggering the refresh flow below.
		}
		config.headers['Authorization'] = `Bearer ${accessToken}`;
	}
	return config;
});

// ═══════════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR — AUTOMATIC TOKEN REFRESH
// ═══════════════════════════════════════════════════════════════════

/** Mutex to prevent multiple simultaneous refresh attempts. */
let isRefreshing = false;

/** Queue of requests waiting for a token refresh to complete. */
let failedQueue = [];

/**
 * Resolve or reject all queued requests once the refresh completes.
 */
const processQueue = (error, token = null) => {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) reject(error);
		else resolve(token);
	});
	failedQueue = [];
};

/**
 * Determine the correct refresh endpoint based on the user's stored role.
 * Falls back to decoding the expired access token for its role claim.
 */
const getRefreshEndpoint = () => {
	try {
		const stored = localStorage.getItem('preferredRole');
		if (stored === 'teacher') return '/api/teachers/refresh-token';
		if (stored === 'student') return '/api/students/refresh-token';

		// Fallback: decode the (possibly expired) access token
		const { accessToken } = getToken();
		if (accessToken) {
			const decoded = decodeToken(accessToken);
			if (decoded?.role === 'teacher') return '/api/teachers/refresh-token';
		}
	} catch {}
	return '/api/students/refresh-token';
};

apiClient.interceptors.response.use(
	response => response,
	async error => {
		const originalRequest = error.config;

		// Only attempt refresh on 401 errors, and only once per request
		if (error.response?.status !== 401 || originalRequest._retry) {
			return Promise.reject(error);
		}

		// Never try to refresh a refresh-token request (avoids infinite loop)
		if (originalRequest.url?.includes('/refresh-token')) {
			removeToken();
			window.dispatchEvent(
				new CustomEvent('api:unauthorized', {
					detail: { reason: 'refresh_failed', url: originalRequest.url },
				}),
			);
			return Promise.reject(error);
		}

		// If a refresh is already in progress, queue this request
		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			}).then(newToken => {
				originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
				return apiClient(originalRequest);
			});
		}

		// Mark as retrying and start the refresh
		originalRequest._retry = true;
		isRefreshing = true;

		try {
			const { refreshToken } = getToken();
			if (!refreshToken) throw new Error('No refresh token available');

			const endpoint = getRefreshEndpoint();
			const res = await publicClient.post(endpoint, { refreshToken });

			const newAuthToken = res.data?.data?.authToken;
			const newRefreshToken = res.data?.data?.refreshToken;

			if (!newAuthToken) throw new Error('No auth token in refresh response');

			// Persist the new tokens
			setToken({ accessToken: newAuthToken, refreshToken: newRefreshToken });

			// Unblock all queued requests with the new token
			processQueue(null, newAuthToken);

			// Retry the original request with the new token
			originalRequest.headers['Authorization'] = `Bearer ${newAuthToken}`;
			return apiClient(originalRequest);
		} catch (refreshError) {
			// Refresh failed — clear everything and force re-login
			processQueue(refreshError, null);
			removeToken();
			window.dispatchEvent(
				new CustomEvent('api:unauthorized', {
					detail: { reason: 'refresh_failed' },
				}),
			);
			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	},
);

// ═══════════════════════════════════════════════════════════════════
// RENDER WAKE-UP (Health Check)
// ═══════════════════════════════════════════════════════════════════

/**
 * Ping the backend health endpoint to wake up the Render server.
 * Call this on landing/auth page mounts. Failures are silently ignored.
 */
export const pingBackendHealth = async () => {
	try {
		await publicClient.get('/api/health', { timeout: 30000 });
		return true;
	} catch {
		return false;
	}
};

// ═══════════════════════════════════════════════════════════════════
// AUTH TOKEN HELPER
// ═══════════════════════════════════════════════════════════════════

export const setAuthToken = token => {
	if (!apiClient?.defaults) return;
	if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	else delete apiClient.defaults.headers.common['Authorization'];
};

export { apiClient, publicClient };
