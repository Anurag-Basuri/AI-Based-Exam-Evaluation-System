import { apiClient, publicClient, parseAxiosError } from './api.js';
import { setToken, removeToken } from '../utils/handleToken.js';

// HELPERS

// Remove tokens on unauthorized/forbidden
const maybeInvalidateToken = error => {
	if (error?.status === 401 || error?.status === 403) {
		removeToken();
	}
};

// Extract and store tokens from success responses
const applyTokensFromResponse = response => {
	const authToken = response?.data?.data?.authToken;
	const refreshToken = response?.data?.data?.refreshToken || null;

	if (authToken) {
		setToken({ accessToken: authToken, refreshToken });
		return true;
	}
	return false;
};

// UNIFIED AUTH

export const registerUser = async userData => {
	try {
		const response = await publicClient.post('/api/auth/register', userData);
		const hasTokens = applyTokensFromResponse(response);
		if (!hasTokens) removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const loginUser = async credentials => {
	try {
		const response = await publicClient.post('/api/auth/login', credentials);
		const hasTokens = applyTokensFromResponse(response);
		if (!hasTokens) removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const googleLogin = async (idToken, role) => {
	try {
		const response = await publicClient.post('/api/auth/google-login', { idToken, role });
		const hasTokens = applyTokensFromResponse(response);
		if (!hasTokens) removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const logoutUser = async () => {
	try {
		const response = await apiClient.post('/api/auth/logout');
		removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		removeToken();
		throw apiErr;
	}
};

// PROFILE / ACCOUNT SETTINGS (Role-specific endpoints)

// STUDENT

export const changeStudentPassword = async pwData => {
	try {
		const response = await apiClient.put('/api/students/change-password', pwData);
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const updateStudentProfile = async profileData => {
	try {
		const response = await apiClient.put('/api/students/update', profileData);
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

// TEACHER

export const changeTeacherPassword = async pwData => {
	try {
		const response = await apiClient.put('/api/teachers/change-password', pwData);
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const updateTeacherProfile = async profileData => {
	try {
		const response = await apiClient.put('/api/teachers/update', profileData);
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

// EMAIL VERIFICATION

export const verifyEmail = async token => {
	try {
		const response = await publicClient.post('/api/auth/verify-email', { token });
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};

export const resendVerification = async () => {
	try {
		const response = await apiClient.post('/api/auth/resend-verification');
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

// PASSWORD RESET

export const forgotPassword = async email => {
	try {
		const response = await publicClient.post('/api/auth/forgot-password', { email });
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};

export const resetPassword = async (token, newPassword) => {
	try {
		const response = await publicClient.post('/api/auth/reset-password', {
			token,
			newPassword,
		});
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};
