import { apiClient } from './api.js';

// Error type to normalize thrown errors
export class ApiError extends Error {
    constructor(message, status = 0, data = null) {
        super(message || 'Request failed');
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

const parseAxiosError = (err) => {
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

// ---------------- Endpoints ----------------
const EP = {
    // Exams
    examsAll: '/api/exams/all',
    examById: (id) => `/api/exams/${encodeURIComponent(id)}`,
    examUpdate: (id) => `/api/exams/${encodeURIComponent(id)}/update`,
    examCreate: '/api/exams/create',
    examDelete: (id) => `/api/exams/${encodeURIComponent(id)}`,
    examAddQuestions: (id) => `/api/exams/${encodeURIComponent(id)}/questions`,
    examRemoveQuestions: (id) => `/api/exams/${encodeURIComponent(id)}/questions/remove`,

    // Questions (teacher only)
    questionCreate: '/api/questions/create',
    questionsAllForTeacher: '/api/questions/all/teacher',
    questionById: (id) => `/api/questions/${encodeURIComponent(id)}`,
    questionUpdate: (id) => `/api/questions/${encodeURIComponent(id)}/update`,
    questionDelete: (id) => `/api/questions/${encodeURIComponent(id)}`,

    // Submissions
    submissionsByExam: (examId) => `/api/submissions/exam/${encodeURIComponent(examId)}`,
    submissionAutoEvaluate: (id) => `/api/submissions/${encodeURIComponent(id)}/auto-evaluate`,
    submissionUpdateEvaluation: (id) => `/api/submissions/${encodeURIComponent(id)}/evaluate`,

    // Issues
    issuesAll: '/api/issues/all',
    issueResolve: (id) => `/api/issues/${encodeURIComponent(id)}/resolve`,
    issueById: (id) => `/api/issues/${encodeURIComponent(id)}`,
};

// ---------------- Normalizers ----------------
const normalizeExam = (e) => ({
    id: String(e._id ?? e.id ?? ''),
    title: e.title ?? 'Untitled Exam',
    description: e.description ?? '',
    status: e.status ?? 'draft', // draft | active | scheduled | completed | cancelled
    duration: e.duration ?? 0,
    enrolled: e.enrolled ?? 0,
    submissions: e.submissions ?? 0,
    startAt: e.startTime ? new Date(e.startTime).toLocaleString() : (e.startAt ?? '—'),
    endAt: e.endTime ? new Date(e.endTime).toLocaleString() : (e.endAt ?? '—'),
    questions: Array.isArray(e.questions) ? e.questions : [],
    createdBy: e.createdBy ?? null,
});

const normalizeSubmission = (s) => ({
    id: String(s._id ?? s.id ?? ''),
    examId: String(s.exam?._id ?? s.examId ?? s.exam ?? ''),
    examTitle: s.exam?.title ?? s.examTitle ?? 'Exam',
    studentId: String(s.student?._id ?? s.studentId ?? s.student ?? ''),
    studentName: s.student?.fullname ?? s.student?.username ?? s.studentName ?? 'Student',
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
    submittedAt: s.submittedAt
        ? new Date(s.submittedAt).toLocaleString()
        : s.updatedAt
            ? new Date(s.updatedAt).toLocaleString()
            : '',
});

const normalizeIssue = (i) => ({
    id: String(i._id ?? i.id ?? ''),
    studentId: String(i.student?._id ?? i.student ?? ''),
    studentName: i.student?.fullname ?? i.student?.username ?? i.studentName ?? 'Student',
    examId: String(i.exam?._id ?? i.exam ?? ''),
    examTitle: i.exam?.title ?? i.examTitle ?? 'Exam',
    issueType: i.issueType ?? i.type ?? 'General',
    description: i.description ?? '',
    status: String(i.status || '').toLowerCase() || 'open',
    reply: i.reply ?? '',
    createdAt: i.createdAt ? new Date(i.createdAt).toLocaleString() : (i.created_at ?? ''),
    resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : (i.resolved_at ?? ''),
});

const normalizeQuestion = (q) => ({
    id: String(q._id ?? q.id ?? ''),
    type: q.type ?? 'subjective',
    text: q.text ?? '',
    remarks: q.remarks ?? '',
    maxMarks: q.max_marks ?? q.maxMarks ?? 0,
    options: Array.isArray(q.options) ? q.options : [],
    answer: q.answer ?? null,
    createdBy: q.createdBy ?? null,
    sourceExam: q.sourceExam ?? null,
});

// ---------------- Exams ----------------
export const createExam = (payload) => apiClient.post(EP.examCreate, payload);

export const getTeacherExams = async (params = {}) => {
    const res = await apiClient.get(EP.examsAll, { params });
    const list = res?.data?.data || [];
    return list.map(normalizeExam);
};

export const getExamById = async (examId) => {
    const res = await apiClient.get(EP.examById(examId));
    return normalizeExam(res?.data?.data ?? res?.data ?? {});
};

export const updateExam = (examId, updates) => apiClient.put(EP.examUpdate(examId), updates);

export const updateExamStatus = (examId, { status }) =>
    apiClient.put(EP.examUpdate(examId), { status });

export const deleteExam = (examId) => apiClient.delete(EP.examDelete(examId));

export const addQuestionsToExam = (examId, questionIds = []) =>
    apiClient.patch(EP.examAddQuestions(examId), { questionIds });

export const removeQuestionsFromExam = (examId, questionIds = []) =>
    apiClient.patch(EP.examRemoveQuestions(examId), { questionIds });

// ---------------- Questions (Teacher) ----------------
export const createQuestion = (payload) => apiClient.post(EP.questionCreate, payload);

export const getTeacherQuestions = async () => {
    const res = await apiClient.get(EP.questionsAllForTeacher);
    const list = res?.data?.data || [];
    return list.map(normalizeQuestion);
};

export const getQuestionById = async (questionId) => {
    const res = await apiClient.get(EP.questionById(questionId));
    return normalizeQuestion(res?.data?.data ?? res?.data ?? {});
};

export const updateQuestion = (questionId, updates) =>
    apiClient.put(EP.questionUpdate(questionId), updates);

export const deleteQuestion = (questionId) => apiClient.delete(EP.questionDelete(questionId));

// ---------------- Submissions ----------------
export const getExamSubmissions = async (examId, params = {}) => {
    const res = await apiClient.get(EP.submissionsByExam(examId), { params });
    const list = res?.data?.data || [];
    return list.map(normalizeSubmission);
};

// Aggregate submissions across teacher’s exams (fallback helper)
export const getTeacherSubmissions = async (params = {}) => {
    const exams = await safeApiCall(getTeacherExams, { teacher: params?.teacher });
    if (!Array.isArray(exams) || !exams.length) return [];
    // Simple chunking to avoid flooding API
    const ids = exams.map((e) => e.id).filter(Boolean);
    const chunks = [];
    for (let i = 0; i < ids.length; i += 5) chunks.push(ids.slice(i, i + 5));
    const results = [];
    for (const chunk of chunks) {
        const group = await Promise.all(
            chunk.map((id) =>
                apiClient
                    .get(EP.submissionsByExam(id))
                    .then((r) => r?.data?.data || [])
                    .catch(() => []),
            ),
        );
        group.flat().forEach((s) => results.push(s));
    }
    return results.map(normalizeSubmission);
};

export const evaluateTeacherSubmission = (submissionId) =>
    apiClient.post(EP.submissionAutoEvaluate(submissionId));

export const updateSubmissionEvaluation = (submissionId, evaluations) =>
    apiClient.patch(EP.submissionUpdateEvaluation(submissionId), { evaluations });

// ---------------- Issues ----------------
export const getTeacherIssues = async (filters = {}) => {
    const res = await apiClient.get(EP.issuesAll, { params: filters });
    const list = res?.data?.data || [];
    return list.map(normalizeIssue);
};

export const getIssueById = async (issueId) => {
    const res = await apiClient.get(EP.issueById(issueId));
    return normalizeIssue(res?.data?.data ?? res?.data ?? {});
};

export const resolveTeacherIssue = (issueId, payload = { reply: '' }) =>
    apiClient.patch(EP.issueResolve(issueId), payload);