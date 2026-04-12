import axios from 'axios';
import { isTokenExpired, getToken, removeToken } from '../utils/handleToken.js';

// ═══════════════════════════════════════════════════════════════════
// BASE CONFIG
// ═══════════════════════════════════════════════════════════════════

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Axios instance for authenticated requests
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 15000,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
});

// Axios instance for public (unauthenticated) requests
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
// INTERCEPTORS
// ═══════════════════════════════════════════════════════════════════

// Attach token to authenticated requests
apiClient.interceptors.request.use(config => {
	const { accessToken } = getToken();
	if (accessToken) {
		if (isTokenExpired(accessToken)) {
			removeToken();
			// Dispatch a custom event so AuthContext can handle graceful logout
			window.dispatchEvent(
				new CustomEvent('api:unauthorized', {
					detail: { reason: 'token_expired' },
				}),
			);
			throw new axios.Cancel('Access token expired');
		}
		config.headers['Authorization'] = `Bearer ${accessToken}`;
	}
	return config;
});

// Handle 401 errors globally via custom event (no hard reloads)
apiClient.interceptors.response.use(
	response => response,
	error => {
		if (error.response && error.response.status === 401) {
			removeToken();
			window.dispatchEvent(
				new CustomEvent('api:unauthorized', {
					detail: { reason: 'server_rejected', url: error.config?.url },
				}),
			);
		}
		return Promise.reject(error);
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
