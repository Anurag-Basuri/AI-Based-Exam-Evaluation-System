import { apiClient, publicClient, parseAxiosError } from './api.js';
import { setToken, removeToken } from '../utils/handleToken.js';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// STUDENT AUTH
// ═══════════════════════════════════════════════════════════════════

export const registerStudent = async studentData => {
	try {
		const response = await publicClient.post('/api/students/register', studentData);
		const hasTokens = applyTokensFromResponse(response);
		if (!hasTokens) removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const loginStudent = async credentials => {
	try {
		const response = await publicClient.post('/api/students/login', credentials);
		const hasTokens = applyTokensFromResponse(response);
		if (!hasTokens) removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const logoutStudent = async () => {
	try {
		const response = await apiClient.post('/api/students/logout');
		removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		removeToken();
		throw apiErr;
	}
};

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

// ═══════════════════════════════════════════════════════════════════
// TEACHER AUTH
// ═══════════════════════════════════════════════════════════════════

export const registerTeacher = async teacherData => {
	try {
		const response = await publicClient.post('/api/teachers/register', teacherData);
		const hasTokens = applyTokensFromResponse(response);
		if (!hasTokens) removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const loginTeacher = async credentials => {
	try {
		const response = await publicClient.post('/api/teachers/login', credentials);
		const hasTokens = applyTokensFromResponse(response);
		if (!hasTokens) removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const logoutTeacher = async () => {
	try {
		const response = await apiClient.post('/api/teachers/logout');
		removeToken();
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		removeToken();
		throw apiErr;
	}
};

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

// ═══════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION
// ═══════════════════════════════════════════════════════════════════

export const verifyStudentEmail = async token => {
	try {
		const response = await publicClient.post('/api/students/verify-email', { token });
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};

export const verifyTeacherEmail = async token => {
	try {
		const response = await publicClient.post('/api/teachers/verify-email', { token });
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};

export const resendStudentVerification = async () => {
	try {
		const response = await apiClient.post('/api/students/resend-verification');
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const resendTeacherVerification = async () => {
	try {
		const response = await apiClient.post('/api/teachers/resend-verification');
		return response.data;
	} catch (err) {
		const apiErr = parseAxiosError(err);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

// ═══════════════════════════════════════════════════════════════════
// PASSWORD RESET
// ═══════════════════════════════════════════════════════════════════

export const forgotStudentPassword = async email => {
	try {
		const response = await publicClient.post('/api/students/forgot-password', { email });
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};

export const forgotTeacherPassword = async email => {
	try {
		const response = await publicClient.post('/api/teachers/forgot-password', { email });
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};

export const resetStudentPassword = async (token, newPassword) => {
	try {
		const response = await publicClient.post('/api/students/reset-password', {
			token,
			newPassword,
		});
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};

export const resetTeacherPassword = async (token, newPassword) => {
	try {
		const response = await publicClient.post('/api/teachers/reset-password', {
			token,
			newPassword,
		});
		return response.data;
	} catch (err) {
		throw parseAxiosError(err);
	}
};
