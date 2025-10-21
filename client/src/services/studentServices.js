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

// Safe API call wrapper
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

const tryPut = async (urls, body, config) => {
	let lastErr;
	for (const url of urls) {
		try {
			const res = await apiClient.put(typeof url === 'function' ? url() : url, body, config);
			return res;
		} catch (e) {
			lastErr = e;
		}
	}
	throw lastErr || new Error('All PUT endpoints failed');
};

// ---------- Endpoints (prioritize server-available first) ----------
const EP = {
	// Exams
	examById: id => `/api/exams/${encodeURIComponent(id)}`,
	examSearch: code => `/api/exams/search/${encodeURIComponent(code)}`,

	// Submissions (student-facing)
	submissionStart: examId => [
		'/api/submissions/start', // body: { examId }
		`/api/submissions/start/${encodeURIComponent(examId)}`,
		'/api/submissions',
	],
	submissionsMine: [
		'/api/submissions/my', // server route
		'/api/submissions/me',
		'/api/submissions/student',
	],
	submissionById: id => `/api/submissions/${encodeURIComponent(id)}`,
	submissionSync: ['/api/submissions/sync'], // body: { examId, answers }
	submissionSubmitBody: ['/api/submissions/submit'], // body: { examId }

	// Issues (student-facing)
	issuesMine: ['/api/issues/me', '/api/issues/student', '/api/issues/my'],
	issueCreate: ['/api/issues/create', '/api/issues'],
	issueById: id => `/api/issues/${encodeURIComponent(id)}`,
	issueReply: id => [
		`/api/issues/${encodeURIComponent(id)}/reply`,
		`/api/issues/${encodeURIComponent(id)}`,
	],

	// Student account
	me: ['/api/students/profile'],
	updateMe: ['/api/students/update'],
	changePassword: ['/api/students/change-password'],
};

// ---------- Normalizers ----------
const normalizeExam = e => {
	const startMs = e.startTime ? new Date(e.startTime).getTime() : (e.start_ms ?? null);
	const endMs = e.endTime ? new Date(e.endTime).getTime() : (e.end_ms ?? null);
	const now = Date.now();
	const isActive = String(e.status || '').toLowerCase() === 'active';
	const inWindow =
		typeof startMs === 'number' && typeof endMs === 'number'
			? now >= startMs && now <= endMs
			: true;

	return {
		id: String(e._id ?? e.id ?? ''),
		title: e.title ?? 'Untitled Exam',
		description: e.description ?? '',
		status: e.status ?? 'draft',
		duration: e.duration ?? 0,
		startAt: e.startTime ? new Date(e.startTime).toLocaleString() : (e.startAt ?? '—'),
		endAt: e.endTime ? new Date(e.endTime).toLocaleString() : (e.endAt ?? '—'),
		startMs: startMs ?? null,
		endMs: endMs ?? null,
		totalQuestions: Array.isArray(e.questions) ? e.questions.length : (e.totalQuestions ?? 0),
		maxScore:
			e.maxScore ??
			(Array.isArray(e.questions)
				? e.questions.reduce((acc, q) => acc + (q?.max_marks ?? q?.maxMarks ?? 0), 0)
				: 0),
		isActive,
		inWindow,
		canStart: isActive && inWindow,
	};
};

const normalizeSubmission = s => ({
	id: String(s._id ?? s.id ?? ''),
	examId: String(s.exam?._id ?? s.examId ?? s.exam ?? ''),
	examTitle: s.exam?.title ?? s.examTitle ?? 'Exam',
	duration: Number(s.duration ?? s.exam?.duration ?? 0),
	answers: Array.isArray(s.answers) ? s.answers : [],
	questions: (s.exam?.questions || []).map(q => ({
		// <-- Add this block to normalize questions
		id: String(q._id ?? q.id),
		text: q.text,
		type: q.type,
		max_marks: q.max_marks,
		options: (q.options || []).map(o => ({
			id: String(o._id ?? o.id),
			text: o.text,
		})),
	})),
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
	status: s.status ?? 'pending',
	startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : '',
	submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString() : '',
});

// ---------- Student: Exams ----------
export const searchExamByCode = async code => {
	const cleaned = String(code || '')
		.trim()
		.toUpperCase();
	try {
		const res = await tryGet([() => EP.examSearch(cleaned)]);
		const data = res?.data?.data ?? res?.data ?? null;
		return data ? normalizeExam(data) : null;
	} catch (e) {
		// Return null for 404, rethrow others
		const status = e?.response?.status ?? e?.status ?? 0;
		if (status === 404) return null;
		throw e;
	}
};

export const getExamById = async examId => {
	const res = await apiClient.get(EP.examById(examId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

// ---------- Student: Submissions ----------
export const getMySubmissions = async (params = {}) => {
	const res = await tryGet(EP.submissionsMine, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list : [];
};

export const startSubmission = async examId => {
	const payload = { examId };
	const res = await tryPost(EP.submissionStart(examId), payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

// Alias for UI import
export const startExam = async examId => startSubmission(examId);

// Search by code (8-char) - removed duplicate declaration to avoid redeclaration error
// Using the earlier normalized implementation defined above.

// Preferred server-aligned sync: by examId
export const syncSubmissionAnswers = async (examId, answers = []) => {
	const res = await tryPatch(EP.submissionSync, { examId, answers });
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

// Save answers
export const saveSubmissionAnswers = async (submissionId, payload) => {
	// This function now expects submissionId and a payload object { answers, markedForReview }
	const res = await tryPatch(
		[`/api/submissions/${encodeURIComponent(submissionId)}/answers`],
		payload,
	);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

// Submit
export const submitSubmission = async (submissionId, payload) => {
	// Simplified: Always submit by submission ID
	const res = await tryPatch(
		[`/api/submissions/${encodeURIComponent(submissionId)}/submit`],
		payload, // payload should be { submissionType: 'manual' | 'auto' }
	);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

export const getSubmissionById = async submissionId => {
	const res = await apiClient.get(EP.submissionById(submissionId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

// ---------- Issues (Student) ----------
const normalizeIssue = i => ({
	id: String(i._id ?? i.id ?? ''),
	examId: String(i.exam?._id ?? i.exam ?? ''),
	examTitle: i.exam?.title ?? i.examTitle ?? 'Exam',
	issueType: i.issueType ?? i.type ?? 'General',
	description: i.description ?? '',
	status: String(i.status || 'open').toLowerCase(),
	reply: i.reply ?? '',
	createdAt: i.createdAt ? new Date(i.createdAt).toLocaleString() : (i.created_at ?? ''),
	resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : (i.resolved_at ?? ''),
});

export const getMyIssues = async (params = {}) => {
	const res = await tryGet(EP.issuesMine, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list.map(normalizeIssue) : [];
};

export const createIssue = async payload => {
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

// Convenience for issue form dropdown
export const getMySubmissionsForIssues = async () => {
	const submissions = await getMySubmissions();
	return submissions.map(s => ({
		id: s.id,
		label: `${s.examTitle} (Submitted: ${s.submittedAt || s.startedAt})`,
	}));
};

// Ensure cookies
try {
	if (apiClient?.defaults) {
		apiClient.defaults.withCredentials = true;
	}
} catch {
	// noop
}
