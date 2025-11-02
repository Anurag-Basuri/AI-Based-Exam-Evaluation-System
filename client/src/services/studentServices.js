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
	const urlArray = Array.isArray(urls) ? urls : [urls];
	for (const url of urlArray) {
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
	const urlArray = Array.isArray(urls) ? urls : [urls];
	for (const url of urlArray) {
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
	const urlArray = Array.isArray(urls) ? urls : [urls];
	for (const url of urlArray) {
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
	const urlArray = Array.isArray(urls) ? urls : [urls];
	for (const url of urlArray) {
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
		`/api/submissions/start/${encodeURIComponent(examId)}`, // Preferred: by param
		'/api/submissions/start', // Fallback: by body
	],
	// FIX: Corrected endpoint to match submission.routes.js
	submissionsMine: ['/api/submissions/my-submissions'],
	submissionById: id => `/api/submissions/${encodeURIComponent(id)}`,
	// FIX: This endpoint is for syncing by submission ID, not examId. Renamed for clarity.
	submissionSyncById: id => `/api/submissions/${encodeURIComponent(id)}/answers`,
	submissionSubmitById: id => `/api/submissions/${encodeURIComponent(id)}/submit`,

	// Issues (student-facing)
	issuesMine: ['/api/issues/student', '/api/issues/me'],
	issueCreate: ['/api/issues/create'],
	issueById: id => `/api/issues/${encodeURIComponent(id)}`,
	// New endpoint for deleting an issue
	issueDelete: id => `/api/issues/${encodeURIComponent(id)}`,
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
	const startMs = e.startTime ? new Date(e.startTime).getTime() : e.start_ms ?? null;
	const endMs = e.endTime ? new Date(e.endTime).getTime() : e.end_ms ?? null;
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
		startAt: e.startTime ? new Date(e.startTime).toLocaleString() : e.startAt ?? '—',
		endAt: e.endTime ? new Date(e.endTime).toLocaleString() : e.endAt ?? '—',
		startMs: startMs ?? null,
		endMs: endMs ?? null,
		totalQuestions: Array.isArray(e.questions) ? e.questions.length : e.totalQuestions ?? 0,
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

const normalizeSubmission = s => {
	const questions = (
		s.questions && s.questions.length > 0 ? s.questions : s.exam?.questions || []
	).map(q => ({
		id: String(q._id ?? q.id),
		text: q.text,
		type: q.type,
		max_marks: q.max_marks,
		options: (q.options || []).map(o => ({
			id: String(o._id ?? o.id),
			text: o.text,
			isCorrect: o.isCorrect,
		})),
		aiPolicy: q.aiPolicy,
	}));

	// Map answers to match questions by ID
	const answersByQuestionId = new Map(
		(s.answers || []).map(a => [String(a.question?._id ?? a.question), a]),
	);

	// Ensure we have an answer slot for each question
	const normalizedAnswers = questions.map(q => {
		const existing = answersByQuestionId.get(q.id);
		if (existing) {
			return {
				question: q.id,
				responseText: existing.responseText || '',
				responseOption: existing.responseOption
					? String(existing.responseOption._id ?? existing.responseOption)
					: null,
			};
		}
		// Create empty answer slot for missing answers
		return {
			question: q.id,
			responseText: '',
			responseOption: null,
		};
	});

	const score =
		s.totalScore ??
		(Array.isArray(s.evaluations)
			? s.evaluations.reduce((acc, ev) => acc + (ev?.evaluation?.marks || 0), 0)
			: s.score ?? null);

	const maxScore =
		s.maxScore ??
		(questions.length > 0
			? questions.reduce((acc, q) => acc + (q.max_marks || 0), 0)
			: s.totalMax ?? 0);

	const hasScore = typeof score === 'number' && Number.isFinite(score);
	const percentage = hasScore && maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

	// Robust date handling: format only if it's not already a string
	const formatDt = dt => {
		if (!dt || typeof dt === 'string') return dt || '';
		try {
			return new Date(dt).toLocaleString();
		} catch {
			return '';
		}
	};

	return {
		id: String(s._id ?? s.id ?? ''),
		examId: String(s.exam?._id ?? s.examId ?? s.exam ?? ''),
		examTitle: s.exam?.title ?? s.examTitle ?? 'Exam',
		examPolicy: s.exam?.aiPolicy,
		duration: Number(s.duration ?? s.exam?.duration ?? 0),
		answers: normalizedAnswers,
		questions: questions,
		markedForReview: Array.isArray(s.markedForReview)
			? s.markedForReview.map(id => String(id))
			: [],
		score,
		maxScore,
		percentage, // Centralized percentage calculation
		status: s.status ?? 'pending',
		startedAt: formatDt(s.startedAt),
		submittedAt: formatDt(s.submittedAt),
		remarks: s.remarks || '', // Ensure remarks field is present
	};
};

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
// --- NEW: Simple in-memory cache for submissions ---
let submissionsCache = {
	data: null,
	timestamp: 0,
};
const CACHE_DURATION = 60 * 1000; // 60 seconds

export const getMySubmissions = async (params = {}, forceRefresh = false) => {
	const now = Date.now();
	if (
		!forceRefresh &&
		submissionsCache.data &&
		now - submissionsCache.timestamp < CACHE_DURATION
	) {
		return submissionsCache.data;
	}

	const res = await tryGet(EP.submissionsMine, { params });
	const list = res?.data?.data || res?.data || [];
	const normalizedList = Array.isArray(list) ? list.map(normalizeSubmission) : [];

	// Update cache
	submissionsCache = {
		data: normalizedList,
		timestamp: now,
	};

	return normalizedList;
};

export const startSubmission = async examId => {
	const payload = { examId };
	const res = await tryPost(EP.submissionStart(examId), payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

// Alias for UI import
export const startExam = async examId => startSubmission(examId);

// Save answers (and markedForReview) for a given submission ID
export const saveSubmissionAnswers = async (submissionId, payload) => {
	// FIX: The backend route uses POST, not PATCH.
	const res = await tryPost([EP.submissionSyncById(submissionId)], payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

// Submit by submission ID
export const submitSubmission = async (submissionId, payload) => {
	const res = await tryPost([EP.submissionSubmitById(submissionId)], payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

export const getSubmissionById = async submissionId => {
	const res = await apiClient.get(EP.submissionById(submissionId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

// ---------- Issues (Student) ----------
const normalizeIssue = i => {
	// CRITICAL FIX: Ensure 'i' itself is not null or undefined.
	if (!i) {
		return {
			id: '',
			examId: '',
			examTitle: 'Unknown Exam',
			student: null,
			issueType: 'other',
			description: 'Error: Could not load issue details.',
			status: 'open',
			reply: '',
			createdAt: '',
			resolvedAt: '',
		};
	}

	return {
		id: String(i._id ?? i.id ?? ''),
		// BUGFIX: Safely access nested properties to prevent the crash.
		examId: String(i.exam?._id ?? i.exam ?? ''),
		examTitle: i.exam?.title ?? i.examTitle ?? 'Exam',
		// Handle populated student from createIssue response
		student: i.student?._id ? { _id: i.student._id } : i.student,
		issueType: i.issueType ?? i.type ?? 'General',
		description: i.description ?? '',
		status: String(i.status || 'open').toLowerCase(),
		reply: i.reply ?? '',
		createdAt: i.createdAt ? new Date(i.createdAt).toLocaleString() : i.created_at ?? '',
		resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : i.resolved_at ?? '',
	};
};

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

export const deleteIssue = async issueId => {
	// Use apiClient.delete for the new endpoint
	const res = await apiClient.delete(EP.issueDelete(issueId));
	return res?.data; // Return the success message
};

export const getIssueById = async issueId => {
	const res = await apiClient.get(EP.issueById(issueId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeIssue(data);
};

export const replyToIssue = (issueId, message) => tryPost(EP.issueReply(issueId), { message });

// Convenience for issue form dropdown
export const getMySubmissionsForIssues = async () => {
	// Use the main getMySubmissions function to leverage caching and normalization
	const submissions = await getMySubmissions({ status: 'submitted' });

	// Create a user-friendly label for the dropdown
	return submissions.map(s => ({
		id: s.id,
		// Use the already-formatted `submittedAt` string from the normalized object
		label: `${s.examTitle} (Submitted: ${s.submittedAt || 'N/A'})`,
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
