import { apiClient, ApiError, parseAxiosError, safeApiCall } from './api.js';

// Re-export centralized utilities so existing consumers don't break
export { ApiError, safeApiCall };

// Helpers for endpoint fallbacks
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

// Endpoints (prioritize server-available first)
const EP = {
	// Exams
	examById: id => `/api/v1/exams/${encodeURIComponent(id)}`,
	examSearch: code => `/api/v1/exams/search/${encodeURIComponent(code)}`,

	// Submissions (student-facing)
	submissionStart: examId => [
		`/api/v1/submissions/start/${encodeURIComponent(examId)}`, // Preferred: by param
		'/api/v1/submissions/start', // Fallback: by body
	],
	submissionsMine: ['/api/v1/submissions/my-submissions'],
	submissionById: id => `/api/v1/submissions/${encodeURIComponent(id)}`,
	submissionSyncById: id => `/api/v1/submissions/${encodeURIComponent(id)}/answers`,
	submissionSubmitById: id => `/api/v1/submissions/${encodeURIComponent(id)}/submit`,
	submissionForResults: id => `/api/v1/submissions/results/${encodeURIComponent(id)}`,

	// Issues (student-facing)
	issuesMine: ['/api/v1/issues/student', '/api/v1/issues/me'],
	issueCreate: ['/api/v1/issues/create'],
	issueById: id => `/api/v1/issues/${encodeURIComponent(id)}`,
	issueDelete: id => `/api/v1/issues/${encodeURIComponent(id)}`,
	issueReply: id => [
		`/api/v1/issues/${encodeURIComponent(id)}/reply`,
		`/api/v1/issues/${encodeURIComponent(id)}`,
	],

	// Student account
	me: ['/api/v1/students/profile'],
	updateMe: ['/api/v1/students/update'],
	changePassword: ['/api/v1/students/change-password'],

	// Classrooms
	classrooms: '/api/v1/classrooms/my',
	classroomJoin: '/api/v1/classrooms/join',
	classroomById: id => `/api/v1/classrooms/${id}`,
	classroomPreview: code => `/api/v1/classrooms/preview/${code}`,
};

// Normalizers
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

const normalizeSubmission = s => {
	if (!s) return null; // Return null if submission is null

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
			: (s.score ?? null));

	const maxScore =
		s.maxScore ??
		(questions.length > 0
			? questions.reduce((acc, q) => acc + (q.max_marks || 0), 0)
			: (s.totalMax ?? 0));

	const hasScore = typeof score === 'number' && Number.isFinite(score);
	const percentage = hasScore && maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

	// Robust date handling: format only if it's not already a string
	const formatDt = dt => {
		if (!dt || typeof dt === 'string') return dt || null; // Return null instead of empty string
		try {
			return new Date(dt).toLocaleString();
		} catch {
			return null;
		}
	};

	return {
		id: String(s._id ?? s.id ?? ''),
		examId: String(s.exam?._id ?? s.examId ?? s.exam ?? ''),
		examTitle: s.exam?.title ?? s.examTitle ?? 'Exam',
		examPolicy: s.exam?.aiPolicy,
		instructions: s.instructions ?? s.exam?.instructions,
		duration: Number(s.duration ?? s.exam?.duration ?? 0),
		answers: normalizedAnswers,
		questions: questions,
		markedForReview: Array.isArray(s.markedForReview)
			? s.markedForReview.map(id => String(id))
			: [],
		score,
		maxScore,
		percentage,
		status: s.status ?? 'pending',
		startedAt: s.startedAt,
		submittedAt: formatDt(s.submittedAt),
		remarks: s.remarks || '',
	};
};

// Student: Exams
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

export const startExam = async examId => {
	// The primary endpoint uses the examId in the URL.
	// The fallback endpoint expects the examId in the body.
	const res = await tryPost(EP.submissionStart(examId), { examId });
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

// Student: Submissions
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

// Get submission details for results page
export const getSubmissionForResults = async submissionId => {
	const res = await tryGet(EP.submissionForResults(submissionId));
	
	return res?.data?.data ?? res?.data ?? null;
};

export const getSubmissionById = async submissionId => {
	const res = await tryGet(EP.submissionById(submissionId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

export const saveSubmissionAnswers = async (submissionId, payload) => {
	const res = await tryPatch(() => EP.submissionSyncById(submissionId), payload);
	const data = res?.data?.data ?? res?.data;
	return normalizeSubmission(data);
};

export const submitSubmission = async (submissionId, payload) => {
	const res = await tryPost(() => EP.submissionSubmitById(submissionId), payload);
	return res?.data?.data ?? res?.data;
};

// Issues (Student)
const normalizeIssue = i => {
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
		examId: String(i.exam?._id ?? i.exam ?? ''),
		examTitle: i.exam?.title ?? i.examTitle ?? 'Exam',
		student: i.student?._id ? { _id: i.student._id } : i.student,
		issueType: i.issueType ?? i.type ?? 'General',
		description: i.description ?? '',
		status: String(i.status || 'open').toLowerCase(),
		reply: i.reply ?? '',
		createdAt: i.createdAt ? new Date(i.createdAt).toLocaleString() : (i.created_at ?? ''),
		resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : (i.resolved_at ?? ''),
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
	const res = await apiClient.delete(EP.issueDelete(issueId));

	return res?.data;
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

	return submissions.map(s => ({
		id: s.id,
		label: `${s.examTitle} (Submitted: ${s.submittedAt || 'N/A'})`,
	}));
};

// ---------- Classrooms (Student) ----------
export const getStudentClassrooms = async () => {
	const res = await tryGet(EP.classrooms);
	return res?.data?.data || [];
};

export const joinStudentClassroom = async joinCode => {
	const res = await tryPost(EP.classroomJoin, { joinCode });
	return res?.data || {};
};

export const getStudentClassroomById = async id => {
	const res = await tryGet(EP.classroomById(id));
	return res?.data?.data || null;
};

export const getClassroomPreview = async joinCode => {
	const res = await tryGet(EP.classroomPreview(joinCode));
	return res?.data?.data || null;
};

// Student Profile Management
export const getStudentProfile = async () => {
	const res = await tryGet(EP.me);
	return res?.data?.data ?? res?.data ?? {};
};

export const updateStudentProfile = async payload => {
	const res = await tryPut(EP.updateMe, payload);
	return res?.data?.data ?? res?.data ?? {};
};

export const changeStudentPassword = async payload => {
	const res = await tryPut(EP.changePassword, payload);
	return res?.data?.data ?? res?.data ?? {};
};

// Export
export const exportStudentProfileCsv = () =>
	apiClient.get('/api/v1/students/export/profile', { responseType: 'blob' });
export const exportStudentSubmissionsCsv = () =>
	apiClient.get('/api/v1/students/export/submissions', { responseType: 'blob' });
