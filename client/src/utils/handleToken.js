import { jwtDecode } from 'jwt-decode';

// ═══════════════════════════════════════════════════════════════════
// STORAGE STRATEGY
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve which storage backend to use based on the "Remember me" preference.
 * - localStorage: persists across browser restarts
 * - sessionStorage: cleared when the tab/window closes
 */
const getStorage = () => {
	try {
		const persist = localStorage.getItem('rememberMe');
		// Default to persistent if no preference has been set
		return persist === 'false' ? sessionStorage : localStorage;
	} catch {
		return localStorage;
	}
};

// ═══════════════════════════════════════════════════════════════════
// TOKEN OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Persist auth tokens to the active storage backend.
 * Only overwrites refreshToken if a new one is provided (allows partial updates
 * like storing just a fresh accessToken after email verification).
 */
export const setToken = (tokens) => {
	try {
		const storage = getStorage();
		if (tokens?.accessToken) {
			storage.setItem('accessToken', tokens.accessToken);
		}
		if (tokens?.refreshToken) {
			storage.setItem('refreshToken', tokens.refreshToken);
		}
	} catch (err) {
		console.error('Error saving token:', err);
	}
};

/**
 * Retrieve tokens from whichever storage holds them.
 * Checks both backends so tokens survive a rememberMe preference change.
 */
export const getToken = () => {
	try {
		const accessToken =
			localStorage.getItem('accessToken') ||
			sessionStorage.getItem('accessToken');
		const refreshToken =
			localStorage.getItem('refreshToken') ||
			sessionStorage.getItem('refreshToken');
		return { accessToken, refreshToken };
	} catch (err) {
		console.error('Error retrieving token:', err);
		return { accessToken: null, refreshToken: null };
	}
};

/**
 * Remove tokens from both storage backends to ensure a clean logout.
 */
export const removeToken = () => {
	try {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
		sessionStorage.removeItem('accessToken');
		sessionStorage.removeItem('refreshToken');
	} catch (err) {
		console.error('Error removing token:', err);
	}
};

// ═══════════════════════════════════════════════════════════════════
// JWT UTILITIES
// ═══════════════════════════════════════════════════════════════════

/** Decode a JWT without verifying the signature (client-side only). */
export const decodeToken = (token) => {
	try {
		return jwtDecode(token);
	} catch (err) {
		console.error('Error decoding token:', err);
		return null;
	}
};

/** Check whether a JWT has expired based on its `exp` claim. */
export const isTokenExpired = (token) => {
	if (!token) return true;
	const decoded = decodeToken(token);
	if (!decoded || !decoded.exp) return true;
	return Date.now() >= decoded.exp * 1000;
};