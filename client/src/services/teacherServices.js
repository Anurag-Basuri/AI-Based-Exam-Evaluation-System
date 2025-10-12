import { apiClient } from './api.js';
import { ApiError, safeApiCall as studentSafe } from './studentServices.js';

// Re-export the student safeApiCall so UI can import from either service uniformly.
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

// ---------- Safe raw helpers (axios response -> return it, throw ApiError) ----------
const safe = async promise => {
	try {
		return await promise;
	} catch (e) {
		throw parseAxiosError(e);
	}
};

// ---------- Fallback request helpers (like studentServices) ----------
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
	throw parseAxiosError(lastErr);
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
	throw parseAxiosError(lastErr);
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
	throw parseAxiosError(lastErr);
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
	throw parseAxiosError(lastErr);
};

// ---------- Endpoints (with fallbacks) ----------
const EP = {
	// Exams (teacher-facing)
	examsAll: ['/api/exams/all', '/api/exams/teacher', '/api/exams'],
	examById: id => `/api/exams/${encodeURIComponent(id)}`,
	examUpdate: id => [
		`/api/exams/${encodeURIComponent(id)}/update`,
		`/api/exams/${encodeURIComponent(id)}`,
		`/api/exams/update/${encodeURIComponent(id)}`,
	],

	// Submissions (teacher-facing)
	submissionsTeacher: ['/api/submissions/teacher', '/api/submissions/all', '/api/submissions'],
	submissionById: id => `/api/submissions/${encodeURIComponent(id)}`,
	submissionEvaluate: id => [
		`/api/submissions/${encodeURIComponent(id)}/evaluate`,
		`/api/submissions/${encodeURIComponent(id)}/grade`,
		`/api/submissions/evaluate/${encodeURIComponent(id)}`,
	],

	// Issues (teacher-facing)
	issuesAll: ['/api/issues/all', '/api/issues/teacher', '/api/issues'],
	issueById: id => `/api/issues/${encodeURIComponent(id)}`,
	issueResolve: id => [
		`/api/issues/${encodeURIComponent(id)}/resolve`,
		`/api/issues/${encodeURIComponent(id)}/reply`,
		`/api/issues/${encodeURIComponent(id)}`,
	],

	// Teacher account
	me: ['/api/teacher/me', '/api/teachers/me'],
	updateMe: ['/api/teacher/me', '/api/teachers/me'],
	changePassword: ['/api/teacher/change-password', '/api/teachers/change-password'],
};

// ---------- Normalizers (UI-friendly, match teacher pages usage) ----------
const normalizeExam = e => {
	const startMs = e?.startTime ? new Date(e.startTime).getTime() : (e?.start_ms ?? null);
	const endMs = e?.endTime ? new Date(e.endTime).getTime() : (e?.end_ms ?? null);

	const enrolled =
		e?.enrolledCount ??
		e?.enrolled ??
		(Array.isArray(e?.students) ? e.students.length : undefined) ??
		(Array.isArray(e?.enrollments) ? e.enrollments.length : 0);

	const submissions =
		e?.submissionCount ??
		(Array.isArray(e?.submissions) ? e.submissions.length : undefined) ??
		e?.submissionsCount ??
		0;

	return {
		id: String(e?._id ?? e?.id ?? ''),
		title: e?.title ?? 'Untitled Exam',
		description: e?.description ?? '',
		status: String(e?.status ?? 'draft').toLowerCase(),
		startAt: e?.startTime ? new Date(e.startTime).toLocaleString() : (e?.startAt ?? '—'),
		endAt: e?.endTime ? new Date(e.endTime).toLocaleString() : (e?.endAt ?? '—'),
		startMs: startMs ?? null,
		endMs: endMs ?? null,
		enrolled: typeof enrolled === 'number' ? enrolled : 0,
		submissions: typeof submissions === 'number' ? submissions : 0,
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
		examId: String(s?.exam?._id ?? s?.examId ?? s?.exam ?? ''),
		examTitle: s?.exam?.title ?? s?.examTitle ?? 'Exam',
		studentId: String(s?.student?._id ?? s?.studentId ?? s?.student ?? ''),
		studentName: s?.student?.fullname ?? s?.studentName ?? s?.student?.name ?? 'Student',
		status: String(s?.status ?? 'pending').toLowerCase(),
		score,
		maxScore,
		startedAt: s?.startedAt ? new Date(s.startedAt).toLocaleString() : '',
		submittedAt: s?.submittedAt ? new Date(s.submittedAt).toLocaleString() : '',
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

// ---------- Exams (Teacher) ----------
export const getTeacherExams = async (params = {}) => {
	const res = await tryGet(EP.examsAll, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list.map(normalizeExam) : [];
};

export const getTeacherExamById = async examId => {
	const res = await safe(apiClient.get(EP.examById(examId)));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeExam(data);
};

export const updateExamStatus = async (examId, body = {}) => {
	// allow both PUT/PATCH fallbacks
	try {
		const res = await tryPatch(EP.examUpdate(examId), body);
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeExam(data);
	} catch (_) {
		const res = await tryPut(EP.examUpdate(examId), body);
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeExam(data);
	}
};

// ---------- Submissions (Teacher) ----------
export const getTeacherSubmissions = async (params = {}) => {
	const res = await tryGet(EP.submissionsTeacher, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list.map(normalizeSubmission) : [];
};

export const getTeacherSubmissionById = async submissionId => {
	const res = await safe(apiClient.get(EP.submissionById(submissionId)));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeSubmission(data);
};

export const evaluateTeacherSubmission = async submissionId => {
	// allow evaluate via PATCH or POST if API differs
	try {
		const res = await tryPatch(EP.submissionEvaluate(submissionId), {});
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeSubmission(data);
	} catch (_) {
		const res = await tryPost(EP.submissionEvaluate(submissionId), {});
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeSubmission(data);
	}
};

// ---------- Issues (Teacher) ----------
export const getTeacherIssues = async (params = {}) => {
	const res = await tryGet(EP.issuesAll, { params });
	const list = res?.data?.data || res?.data || [];
	return Array.isArray(list) ? list.map(normalizeIssue) : [];
};

export const getTeacherIssueById = async issueId => {
	const res = await safe(apiClient.get(EP.issueById(issueId)));
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeIssue(data);
};

export const resolveTeacherIssue = async (issueId, body = {}) => {
	// API may require { message, status: 'resolved' } or similar
	const payload = { ...body };
	if (!payload.status) payload.status = 'resolved';
	try {
		const res = await tryPatch(EP.issueResolve(issueId), payload);
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeIssue(data);
	} catch (_) {
		const res = await tryPost(EP.issueResolve(issueId), payload);
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeIssue(data);
	}
};

// ---------- Profile & Settings (Teacher) ----------
export const getTeacherProfile = async () => {
	const res = await tryGet(EP.me);
	const data = res?.data?.data ?? res?.data ?? {};
	return normalizeTeacher(data);
};

export const updateTeacherProfile = async profile => {
	const payload = {
		username: profile?.username ?? '',
		fullname: profile?.fullname ?? '',
		email: profile?.email ?? '',
		phonenumber: profile?.phonenumber ?? '',
		department: profile?.department ?? '',
		address: profile?.address ?? '',
	};
	// Many backends accept PATCH here; fallback to PUT if needed
	try {
		const res = await tryPatch(EP.updateMe, payload);
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeTeacher(data);
	} catch (_) {
		const res = await tryPut(EP.updateMe, payload);
		const data = res?.data?.data ?? res?.data ?? {};
		return normalizeTeacher(data);
	}
};

export const changeTeacherPassword = async ({ currentPassword, newPassword }) => {
	const res = await tryPatch(EP.changePassword, { currentPassword, newPassword });
	// Prefer returning a success boolean to simplify UI
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
