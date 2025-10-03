import { apiClient } from './api.js';

// ---------- Error normalization ----------
export class ApiError extends Error {
	constructor(message, status = 0, data = null) {
		super(message || 'Request failed');
		this.name = 'ApiError';
		this.status = status;
		this.data = data;
	}
}

const parseAxiosError = err => {
	if (!err) return new ApiError('Unknown error');
	if (err?.name === 'CanceledError') return new ApiError('Request canceled', 499);
	const status = err?.response?.status ?? 0;
	const data = err?.response?.data;
	const msg =
		data?.message ||
		data?.error ||
		err?.message ||
		(status ? `Request failed with status ${status}` : 'Network error');
	return new ApiError(msg, status, data);
};

// Safe API call wrapper: returns payload (not raw axios response)
export const safeApiCall = async (fn, ...args) => {
	try {
		const res = await fn(...args);
		return res?.data?.data ?? res?.data ?? res;
	} catch (err) {
		throw parseAxiosError(err);
	}
};

// ---------- Helpers for endpoint fallbacks ----------
const tryGet = async (urls, config) => {
	let lastErr;
	for (const url of urls) {
		try {
			const res = await apiClient.get(typeof url === 'function' ? url() : url, config);
			return res;
		} catch (e) {
			lastErr = e;
		}
	}
	throw lastErr || new Error('All GET endpoints failed');
};

const tryPost = async (urls, body, config) => {
	let lastErr;
	for (const url of urls) {
		try {
			const res = await apiClient.post(typeof url === 'function' ? url() : url, body, config);
			return res;
		} catch (e) {
			lastErr = e;
		}
	}
	throw lastErr || new Error('All POST endpoints failed');
};

const tryPatch = async (urls, body, config) => {
	let lastErr;
	for (const url of urls) {
		try {
			const res = await apiClient.patch(
				typeof url === 'function' ? url() : url,
				body,
				config,
			);
			return res;
		} catch (e) {
			lastErr = e;
		}
	}
	throw lastErr || new Error('All PATCH endpoints failed');
};

// ---------- Endpoints (with fallbacks) ----------
const EP = {
	// Exams visible to a student
	examsAvailable: ['/api/exams/available', '/api/exams/student', '/api/exams/my'],
	examById: id => `/api/exams/${encodeURIComponent(id)}`,

	// Submissions (student-facing)
	submissionStart: examId => [
		`/api/submissions/start/${encodeURIComponent(examId)}`,
		'/api/submissions/start', // body: { examId }
		'/api/submissions', // body: { examId }
	],
	submissionsMine: ['/api/submissions/me', '/api/submissions/student', '/api/submissions/my'],
	submissionById: id => `/api/submissions/${encodeURIComponent(id)}`,
	submissionSaveAnswers: id => [
		`/api/submissions/${encodeURIComponent(id)}/answers`,
		`/api/submissions/${encodeURIComponent(id)}/answer`,
	],
	submissionSubmit: id => [
		`/api/submissions/${encodeURIComponent(id)}/submit`,
		`/api/submissions/${encodeURIComponent(id)}/finalize`,
	],

	// Issues (student-facing)
	issuesMine: ['/api/issues/me', '/api/issues/student', '/api/issues/my'],
	issueCreate: ['/api/issues/create', '/api/issues'],
	issueById: id => `/api/issues/${encodeURIComponent(id)}`,
	issueReply: id => [
		`/api/issues/${encodeURIComponent(id)}/reply`,
		`/api/issues/${encodeURIComponent(id)}`,
	],
};

// ---------- Normalizers ----------
const normalizeExam = e => ({
	id: String(e._id ?? e.id ?? ''),
	title: e.title ?? 'Untitled Exam',
	description: e.description ?? '',
	status: e.status ?? 'draft', // draft | scheduled | live/active | completed | cancelled
	duration: e.duration ?? 0,
	startAt: e.startTime ? new Date(e.startTime).toLocaleString() : (e.startAt ?? '—'),
	endAt: e.endTime ? new Date(e.endTime).toLocaleString() : (e.endAt ?? '—'),
	totalQuestions: Array.isArray(e.questions) ? e.questions.length : (e.totalQuestions ?? 0),
	maxScore:
		e.maxScore ??
		(Array.isArray(e.questions)
			? e.questions.reduce((acc, q) => acc + (q?.max_marks ?? q?.maxMarks ?? 0), 0)
			: 0),
});

const normalizeSubmission = s => ({
	id: String(s._id ?? s.id ?? ''),
	examId: String(s.exam?._id ?? s.examId ?? s.exam ?? ''),
	examTitle: s.exam?.title ?? s.examTitle ?? 'Exam',
	answers: Array.isArray(s.answers) ? s.answers : [],
	score:
		s.totalScore ??
		(Array.isArray(s.evaluations)
			? s.evaluations.reduce((acc, ev) => acc + (ev?.evaluation?.marks || 0), 0)
			: (s.score ?? null)),
	maxScore:
		s.maxScore ??
		(Array.isArray(s.answers)
			? s.answers.reduce((acc, ans) => acc + (ans?.question?.max_marks || 0), 0)
			: (s.totalMax ?? 0)),
	status: s.status ?? 'pending', // pending | submitted | evaluated | flagged
	startedAt: s.startedAt ? new Date(s.startedAt).toLocaleString() : '',
	submittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '',
});

const normalizeIssue = i => ({
	id: String(i._id ?? i.id ?? ''),
	examId: String(i.exam?._id ?? i.exam ?? ''),
	examTitle: i.exam?.title ?? i.examTitle ?? 'Exam',
	issueType: i.issueType ?? i.type ?? 'General',
	description: i.description ?? '',
	status: String(i.status || '').toLowerCase() || 'open',
	reply: i.reply ?? '',
	createdAt: i.createdAt ? new Date(i.createdAt).toLocaleString() : (i.created_at ?? ''),
	resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : (i.resolved_at ?? ''),
});

// ---------- Exams (Student) ----------
export const getStudentExams = async (params = {}) => {
	const res = await tryGet(EP.examsAvailable, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list.map(normalizeExam) : [];
};

export const getExamById = async examId => {
	const res = await apiClient.get(EP.examById(examId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

// ---------- Submissions (Student) ----------
export const startSubmission = async (examId, payload = {}) => {
	// try various endpoints; if second/third used, send { examId, ...payload }
	const res = await tryPost(
		[
			() => EP.submissionStart(examId)[0],
			EP.submissionStart(examId)[1],
			EP.submissionStart(examId)[2],
		],
		{ examId, ...payload },
	);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

export const getMySubmissions = async (params = {}) => {
	const res = await tryGet(EP.submissionsMine, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list.map(normalizeSubmission) : [];
};

export const getSubmissionById = async submissionId => {
	const res = await apiClient.get(EP.submissionById(submissionId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

export const saveSubmissionAnswers = (submissionId, answers = []) => {
	// answers: [{ questionId, answer, timeSpent, ... }]
	// first try PATCH /answers, then fallback to /answer
	return tryPatch(EP.submissionSaveAnswers(submissionId), { answers });
};

export const saveSubmissionAnswer = (submissionId, { questionId, answer, timeSpent, ...rest }) =>
	saveSubmissionAnswers(submissionId, [{ questionId, answer, timeSpent, ...rest }]);

export const submitSubmission = async (submissionId, payload = {}) => {
	// try PATCH first, then fallback POST if supported
	try {
		const res = await tryPatch(EP.submissionSubmit(submissionId), { ...payload });
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeSubmission(data);
	} catch (_) {
		const res = await tryPost(EP.submissionSubmit(submissionId), { ...payload });
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeSubmission(data);
	}
};

// ---------- Issues (Student) ----------
export const getMyIssues = async (params = {}) => {
	const res = await tryGet(EP.issuesMine, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list.map(normalizeIssue) : [];
};

export const createIssue = async payload => {
	// payload: { examId, issueType, description }
	const res = await tryPost(EP.issueCreate, payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeIssue(data);
};

export const getIssueById = async issueId => {
	const res = await apiClient.get(EP.issueById(issueId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeIssue(data);
};

export const replyToIssue = (issueId, message) => tryPost(EP.issueReply(issueId), { message });

// ---------------- Student: Account (non-auth) ----------------
export const updateStudentProfile = (profile) => 
  apiClient.put('/api/students/update', profile);

export const changeStudentPassword = (payload) =>
  apiClient.put('/api/students/change-password', payload);

export const logoutStudentApi = () => 
  apiClient.post('/api/students/logout');
