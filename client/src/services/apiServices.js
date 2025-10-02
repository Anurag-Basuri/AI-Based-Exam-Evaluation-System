// Centralized, typed-ish client helpers using your apiClient/publicClient
import { apiClient, publicClient } from './api.js';
import { setToken, removeToken } from '../utils/handleToken.js';

// Error type to normalize thrown errors
class ApiError extends Error {
	constructor(message, meta = {}) {
		super(message || 'Request failed');
		this.name = 'ApiError';
		this.status = meta.status ?? null;
		this.code = meta.code ?? null; // Axios error code (e.g., ERR_NETWORK)
		this.data = meta.data ?? null; // server-provided payload
		this.url = meta.url ?? null;
		this.method = meta.method ?? null;
	}
}

const parseAxiosError = err => {
	// Axios-like error shape
	const resp = err?.response;
	const req = err?.config;
	const message = resp?.data?.message || resp?.data?.error || err?.message || 'Unknown error';

	return new ApiError(message, {
		status: resp?.status,
		code: err?.code || resp?.data?.code || null,
		data: resp?.data ?? null,
		url: req?.url || req?.baseURL ? `${req?.baseURL || ''}${req?.url || ''}` : null,
		method: req?.method || null,
	});
};

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

// Safe API call wrapper
export const safeApiCall = async (fn, ...args) => {
	try {
		const res = await fn(...args);
		// Support ApiResponse shape or raw data
		return res?.data?.data ?? res?.data ?? res;
	} catch (e) {
		const msg = e?.response?.data?.message || e?.message || 'Request failed';
		const err = new Error(msg);
		err.status = e?.response?.status;
		err.data = e?.response?.data;
		throw err;
	}
};

// Endpoints (adjust here if server paths differ)
const EP = {
	examsList: '/api/exams/all',
	submissionStart: '/api/submissions/start',
	submissionsMine: '/api/submissions/my',
	issuesMine: '/api/issues/student',
	issueCreate: '/api/issues/create',
	studentUpdate: '/api/students/update',
	changePassword: '/api/students/change-password',
	logout: '/api/students/logout',
};

// Exams
export const getStudentExams = async () => {
	const res = await apiClient.get(EP.examsList);
	const list = res?.data?.data || [];
	return list.map(e => ({
		id: String(e._id),
		title: e.title,
		status: e.status || 'upcoming',
		durationMin: e.duration ?? e.durationMin ?? 0,
		startAt: e.startTime ? new Date(e.startTime).toLocaleString() : '',
	}));
};

export const startStudentSubmission = body => apiClient.post(EP.submissionStart, body);

// Results
export const getStudentResults = async () => {
	const res = await apiClient.get(EP.submissionsMine);
	const list = res?.data?.data || [];
	return list.map(r => ({
		id: String(r.id ?? r._id),
		examTitle: r.examTitle ?? r.exam?.title ?? 'Exam',
		score: r.score ?? 0,
		maxScore: r.maxScore ?? 0,
		status: r.status ?? 'pending',
		evaluatedAt: r.evaluatedAt ?? (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : null),
		remarks: r.remarks ?? '',
	}));
};

// Issues
export const getStudentIssues = async () => {
	const res = await apiClient.get(EP.issuesMine);
	return res?.data?.data || [];
};

export const createStudentIssue = payload => apiClient.post(EP.issueCreate, payload);

export const logoutStudentApi = () => apiClient.post(EP.logout);

// --- Auth Services ---
export const registerStudent = async studentData => {
	try {
		const response = await publicClient.post('/api/students/register', studentData);
		const hasTokens = applyTokensFromResponse(response);
		if (!hasTokens) removeToken(); // defensive: registration should return tokens
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
		// On any logout error, ensure tokens are cleared
		removeToken();
		throw apiErr;
	}
};

export const changeStudentPassword = async pwData => {
	try {
		const response = await apiClient.put('/api/students/change-password', pwData);
		return response.data;
	} catch (error) {
		const apiErr = parseAxiosError(error);
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
	} catch (error) {
		const apiErr = parseAxiosError(error);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

export const updateTeacherProfile = async profileData => {
	try {
		const response = await apiClient.put('/api/teachers/update', profileData);
		return response.data;
	} catch (error) {
		const apiErr = parseAxiosError(error);
		maybeInvalidateToken(apiErr);
		throw apiErr;
	}
};

// --- Teacher data helpers (used by teacher pages) ---
export const getTeacherExams = async (params = {}) => {
	const res = await apiClient.get('/api/exams/all', { params });
	return res?.data?.data || [];
};

export const getTeacherIssues = async (filters = {}) => {
	const res = await apiClient.get('/api/issues/all', { params: filters });
	return res?.data?.data || [];
};

export const getTeacherSubmissions = async examId => {
	if (!examId) return [];
	const res = await apiClient.get(`/api/submissions/exam/${encodeURIComponent(examId)}`);
	const list = res?.data?.data || [];
	// normalize defensively
	return list.map(s => ({
		id: String(s._id ?? s.id ?? ''),
		examTitle: s.exam?.title ?? s.examTitle ?? 'Exam',
		studentName: s.student?.fullname ?? s.student?.username ?? s.studentName ?? 'Student',
		score: s.totalScore ?? s.score ?? 0,
		maxScore: s.maxScore ?? s.totalMax ?? 0,
		status: s.status ?? 'pending',
		submittedAt: s.submittedAt
			? new Date(s.submittedAt).toLocaleString()
			: s.updatedAt
				? new Date(s.updatedAt).toLocaleString()
				: null,
	}));
};

export const resolveIssue = async (issueId, reply) =>
	apiClient.patch(`/api/issues/${encodeURIComponent(issueId)}/resolve`, { reply });
