import { apiClient } from './api.js';
import { ApiError, safeApiCall as studentSafe } from './studentServices.js';

// Re-export the student safeApiCall so UI can import uniformly
export const safeApiCall = studentSafe;

// ---------- Error normalization (aligned with studentServices) ----------
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

// ---------- Safe raw helpers ----------
const safe = async promise => {
	try {
		return await promise;
	} catch (e) {
		throw parseAxiosError(e);
	}
};

// ---------- Fallback helpers (match studentServices) ----------
const tryGet = async (urls, config) => {
	let lastErr;
	for (const url of Array.isArray(urls) ? urls : [urls]) {
		try {
			const u = typeof url === 'function' ? url() : url;
			return await apiClient.get(u, config);
		} catch (e) {
			lastErr = e;
		}
	}
	throw parseAxiosError(lastErr);
};

const tryPost = async (urls, body, config) => {
	let lastErr;
	for (const url of Array.isArray(urls) ? urls : [urls]) {
		try {
			const u = typeof url === 'function' ? url() : url;
			return await apiClient.post(u, body, config);
		} catch (e) {
			lastErr = e;
		}
	}
	throw parseAxiosError(lastErr);
};

const tryPatch = async (urls, body, config) => {
	let lastErr;
	for (const url of Array.isArray(urls) ? urls : [urls]) {
		try {
			const u = typeof url === 'function' ? url() : url;
			return await apiClient.patch(u, body, config);
		} catch (e) {
			lastErr = e;
		}
	}
	throw parseAxiosError(lastErr);
};

const tryPut = async (urls, body, config) => {
	let lastErr;
	for (const url of Array.isArray(urls) ? urls : [urls]) {
		try {
			const u = typeof url === 'function' ? url() : url;
			return await apiClient.put(u, body, config);
		} catch (e) {
			lastErr = e;
		}
	}
	throw parseAxiosError(lastErr);
};

// ADD: tryDelete helper (same retry semantics)
const tryDelete = async (urls, config) => {
	let lastErr;
	for (const url of Array.isArray(urls) ? urls : [urls]) {
		try {
			const u = typeof url === 'function' ? url() : url;
			return await apiClient.delete(u, config);
		} catch (e) {
			lastErr = e;
		}
	}
	throw parseAxiosError(lastErr);
};

// ---------- Endpoints (server-aligned) ----------
const EP = {
	// Exams
	examCreate: ['/api/exams/create'],
	examsAll: ['/api/exams/all'],
	examsMine: ['/api/exams/mine'],
	examById: id => `/api/exams/${encodeURIComponent(id)}`,
	examUpdate: id => [`/api/exams/${encodeURIComponent(id)}/update`],
	// FIX: delete endpoints must be strings (axios.delete expects a single URL)
	examDelete: id => `/api/exams/${encodeURIComponent(id)}`,
	examAddQuestions: id => [`/api/exams/${encodeURIComponent(id)}/questions`],
	examRemoveQuestions: id => [`/api/exams/${encodeURIComponent(id)}/questions/remove`],
	examPublish: id => [`/api/exams/${encodeURIComponent(id)}/publish`],
	examDuplicate: id => [`/api/exams/${encodeURIComponent(id)}/duplicate`],
	examReorder: id => [`/api/exams/${encodeURIComponent(id)}/reorder`],
	examSetQuestions: id => [`/api/exams/${encodeURIComponent(id)}/questions/set`],
	examEndNow: id => [`/api/exams/${encodeURIComponent(id)}/end-now`],
	examCancel: id => [`/api/exams/${encodeURIComponent(id)}/cancel`],
	examExtend: id => [`/api/exams/${encodeURIComponent(id)}/extend`],
	examRegenerateCode: id => [`/api/exams/${encodeURIComponent(id)}/regenerate-code`],

	// Submissions (teacher)
	submissionsByExam: examId => `/api/submissions/exam/${encodeURIComponent(examId)}`,
	submissionEvalUpdate: id => `/api/submissions/${encodeURIComponent(id)}/evaluate`,
	submissionAutoEvaluate: id => `/api/submissions/${encodeURIComponent(id)}/auto-evaluate`,

	// Issues (teacher)
	issuesAll: ['/api/issues/all'],
	issueById: id => `/api/issues/${encodeURIComponent(id)}`,
	issueResolve: id => `/api/issues/${encodeURIComponent(id)}/resolve`,
	issueStatus: id => `/api/issues/${encodeURIComponent(id)}/status`,

	// Teacher account
	teacherUpdate: ['/api/teachers/update'],
	teacherChangePassword: ['/api/teachers/change-password'],

	// Questions (teacher)
	questionCreate: ['/api/questions/create'],
	questionsMine: ['/api/questions/mine'],
	questionById: id => `/api/questions/${encodeURIComponent(id)}`,
	questionUpdate: id => [`/api/questions/${encodeURIComponent(id)}/update`],
	// FIX: string for delete
	questionDelete: id => `/api/questions/${encodeURIComponent(id)}`,
};

// ---------- Normalizers ----------
const normalizeExam = e => {
	const enrolled =
		e?.enrolledCount ??
		e?.enrolled ??
		(Array.isArray(e?.students) ? e.students.length : undefined) ??
		(Array.isArray(e?.enrollments) ? e.enrollments.length : 0);

	const submissions =
		e?.submissionCount ??
		e?.submissionsCount ??
		(Array.isArray(e?.submissions) ? e.submissions.length : 0);

	// Derive time and dynamic status (live/scheduled) for better UX
	const startMs = e?.startTime ? new Date(e.startTime).getTime() : (e?.startMs ?? null);
	const endMs = e?.endTime ? new Date(e.endTime).getTime() : (e?.endMs ?? null);
	const rawStatus = String(e?.status ?? 'draft').toLowerCase();
	let derivedStatus = rawStatus;
	if (rawStatus === 'active' && startMs && endMs) {
		const now = Date.now();
		if (now < startMs) derivedStatus = 'scheduled';
		else if (now >= startMs && now <= endMs) derivedStatus = 'live';
		else if (now > endMs) derivedStatus = 'completed';
	}

	return {
		id: String(e?._id ?? e?.id ?? ''),
		title: e?.title ?? 'Untitled Exam',
		description: e?.description ?? '',
		duration: e?.duration ?? 0,
		status: rawStatus, // server status
		derivedStatus, // UI status: draft/scheduled/live/completed/cancelled
		searchId: e?.searchId ?? e?.search_id ?? '',
		startAt: e?.startTime ? new Date(e.startTime).toLocaleString() : (e?.startAt ?? ''),
		endAt: e?.endTime ? new Date(e.endTime).toLocaleString() : (e?.endAt ?? ''),
		startMs: startMs ?? null,
		endMs: endMs ?? null,
		createdBy: String(e?.createdBy?._id ?? e?.createdBy ?? ''),
		enrolled: typeof enrolled === 'number' ? enrolled : 0,
		submissions: typeof submissions === 'number' ? submissions : 0,
		questions: Array.isArray(e?.questions) ? e.questions.map(q => String(q?._id ?? q)) : [],
	};
};

const normalizeSubmission = s => {
	const score =
		s?.totalScore ??
		(Array.isArray(s?.evaluations)
			? s.evaluations.reduce((acc, ev) => acc + (ev?.evaluation?.marks || 0), 0)
			: (s?.score ?? null));

	const maxScore =
		s?.maxScore ??
		(Array.isArray(s?.answers)
			? s.answers.reduce((acc, ans) => acc + (ans?.question?.max_marks || 0), 0)
			: (s?.totalMax ?? 0));

	return {
		id: String(s?._id ?? s?.id ?? ''),
		examId: String(s?.exam?._id ?? s?.exam ?? ''),
		examTitle: s?.exam?.title ?? s?.examTitle ?? 'Exam',
		studentId: String(s?.student?._id ?? s?.student ?? ''),
		studentName: s?.student?.fullname ?? s?.studentName ?? s?.student?.username ?? 'Student',
		status: String(s?.status ?? 'pending').toLowerCase(),
		score,
		maxScore,
		startedAt: s?.startedAt ? new Date(s.startedAt).toLocaleString() : '',
		submittedAt: s?.submittedAt ? new Date(s.submittedAt).toLocaleString() : '',
		evaluatedAt: s?.evaluatedAt ? new Date(s.evaluatedAt).toLocaleString() : '',
	};
};

const normalizeIssue = i => ({
	id: String(i?._id ?? i?.id ?? ''),
	examId: String(i?.exam?._id ?? i?.exam ?? ''),
	examTitle: i?.exam?.title ?? i?.examTitle ?? 'Exam',
	issueType: i?.issueType ?? i?.type ?? 'General',
	description: i?.description ?? '',
	status: String(i?.status || 'open').toLowerCase(),
	reply: i?.reply ?? '',
	studentId: String(i?.student?._id ?? i?.student ?? ''),
	studentName: i?.student?.fullname ?? i?.studentName ?? 'Student',
	createdAt: i?.createdAt ? new Date(i.createdAt).toLocaleString() : (i?.created_at ?? ''),
	resolvedAt: i?.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : (i?.resolved_at ?? ''),
});

const normalizeTeacher = t => ({
	id: String(t?._id ?? t?.id ?? t?.userId ?? ''),
	username: t?.username ?? '',
	fullname: t?.fullname ?? t?.name ?? '',
	email: t?.email ?? '',
	phonenumber: t?.phonenumber ?? t?.phone ?? '',
	department: t?.department ?? '',
	address: typeof t?.address === 'string' ? t.address : '',
});

// Normalizer for Question
const normalizeQuestion = q => ({
	id: String(q?._id ?? q?.id ?? ''),
	type: q?.type === 'multiple-choice' || q?.type === 'subjective' ? q.type : 'subjective',
	text: q?.text ?? '',
	remarks: q?.remarks ?? '',
	max_marks: Number.isFinite(q?.max_marks) ? q.max_marks : 1,
	options: Array.isArray(q?.options)
		? q.options.map((o, i) => ({
				id: String(i),
				text: o?.text ?? '',
				isCorrect: !!o?.isCorrect,
			}))
		: [],
	answer: q?.answer ?? null,
	createdBy: String(q?.createdBy?._id ?? q?.createdBy ?? ''),
	sourceExam: String(q?.sourceExam ?? ''),
	createdAt: q?.createdAt || '',
	updatedAt: q?.updatedAt || '',
});

// ---------- Exams (Teacher) ----------
export const createTeacherExam = async payload => {
	const res = await tryPost(EP.examCreate, payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

export const addQuestionsToExam = async (examId, questionIds = []) => {
	const res = await tryPatch(EP.examAddQuestions(examId), { questionIds });
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

export const removeQuestionsFromExam = async (examId, questionIds = []) => {
	const res = await tryPatch(EP.examRemoveQuestions(examId), { questionIds });
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

// Set full question set (server validates ownership on draft)
export const setExamQuestions = async (examId, questionIds = []) => {
	const res = await tryPatch(EP.examSetQuestions(examId), { questionIds });
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

export const reorderExamQuestions = async (examId, order = []) => {
	const res = await tryPatch(EP.examReorder(examId), { order });
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

export const getTeacherExams = async (params = {}) => {
	// Prefer fast "mine" list; fallback to /all if not available
	try {
		const resMine = await tryGet(EP.examsMine, { params });
		const payload = resMine?.data?.data ?? resMine?.data ?? { items: [] };
		const list = Array.isArray(payload?.items) ? payload.items : [];

		// Return the full paginated object with normalized items
		return {
			...payload,
			items: list.map(normalizeExam),
		};
	} catch (_) {
		const resAll = await tryGet(EP.examsAll, { params });
		const list = resAll?.data?.data || resAll?.data || [];
		const items = Array.isArray(list) ? list.map(normalizeExam) : [];
		// Mimic paginated response for fallback
		return {
			items,
			page: 1,
			limit: items.length,
			total: items.length,
		};
	}
};

export const getTeacherExamById = async examId => {
	const res = await safe(apiClient.get(EP.examById(examId)));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

export const updateExam = async (examId, body = {}) => {
	const res = await tryPut(EP.examUpdate(examId), body);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

// Keep for generic updates; for publishing prefer publishTeacherExam below
export const updateExamStatus = async (examId, statusBody = {}) => {
	return updateExam(examId, statusBody);
};

export const publishTeacherExam = async examId => {
	const res = await tryPost(EP.examPublish(examId), {});
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

export const duplicateTeacherExam = async examId => {
	const res = await tryPost(EP.examDuplicate(examId), {});
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

export const deleteExam = async examId => {
	const res = await tryDelete(EP.examDelete(examId));
	const ok = !!(
		res?.data?.success ??
		res?.data?.data?.success ??
		(res?.status >= 200 && res?.status < 300)
	);
	return { success: ok };
};

// ---------- Questions (Teacher) ----------
export const getTeacherQuestions = async (params = {}) => {
	const res = await tryGet(EP.questionsMine, { params });
	const payload = res?.data?.data ?? res?.data ?? { items: [] };
	// The backend returns a paginated object { items, page, limit }.
	// The component needs this full object.
	const list = Array.isArray(payload?.items) ? payload.items.map(normalizeQuestion) : [];
	return {
		...payload,
		items: list,
	};
};

export const createTeacherQuestion = async payload => {
	const res = await tryPost(EP.questionCreate, payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeQuestion(data);
};

// Optionals if needed later
export const updateTeacherQuestion = async (id, payload) => {
	const res = await tryPut(EP.questionUpdate(id), payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeQuestion(data);
};

export const deleteTeacherQuestion = async id => {
	const res = await tryDelete(EP.questionDelete(id));
	const ok = !!(
		res?.data?.success ??
		res?.data?.data?.success ??
		(res?.status >= 200 && res?.status < 300)
	);
	return { success: ok };
};

// ---------- Submissions (Teacher) ----------
export const getTeacherSubmissions = async (examId = '') => {
	const url = examId ? `${EP.submissionsByExam}/${examId}` : EP.submissionsAll;
	return await tryGet(url);
};

export const evaluateTeacherSubmission = async submissionId => {
	return await tryPost(`${EP.submissionsBase}/${submissionId}/evaluate-auto`);
};

// --- NEW: Add publishing services ---
export const publishSingleResult = async submissionId => {
	return await tryPost(`${EP.submissionsBase}/${submissionId}/publish`);
};

export const publishAllResults = async examId => {
	return await tryPost(`${EP.submissionsByExam}/${examId}/publish-all`);
};

// ---------- Issues (Teacher) ----------
export const getTeacherIssues = async (params = {}) => {
	const res = await tryGet(EP.issuesAll, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list.map(normalizeIssue) : [];
};

export const getTeacherIssueById = async issueId => {
	const res = await tryGet(EP.issueById(issueId));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeIssue(data);
};

export const resolveTeacherIssue = async (issueId, reply) => {
	const res = await tryPatch(EP.issueResolve(issueId), { reply });
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeIssue(data);
};

export const updateTeacherIssueStatus = async (issueId, status) => {
	const res = await tryPatch(EP.issueStatus(issueId), { status });
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeIssue(data);
};

// ---------- Profile & Settings (Teacher) ----------
export const updateTeacherProfile = async profile => {
	const payload = {
		username: profile?.username ?? '',
		fullname: profile?.fullname ?? '',
		email: profile?.email ?? '',
		phonenumber: profile?.phonenumber ?? '',
		department: profile?.department ?? '',
		address: profile?.address ?? '',
	};
	const res = await tryPut(EP.teacherUpdate, payload);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeTeacher(data);
};

export const changeTeacherPassword = async ({ currentPassword, newPassword }) => {
	const res = await tryPut(EP.teacherChangePassword, { currentPassword, newPassword });
	const data = res?.data?.data ?? res?.data ?? { success: true };
	return { success: !!(data?.success ?? true) };
};

// Ensure cookies if server uses cookie sessions
try {
	if (apiClient?.defaults) {
		apiClient.defaults.withCredentials = true;
	}
} catch {
	// noop
}
