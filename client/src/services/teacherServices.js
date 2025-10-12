import { ApiError } from './studentServices.js';
import api from './api.js';

// Helpers
const parseAxiosError = err => {
    const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Request failed';
    return new ApiError(msg, err?.response?.status || 500);
};

const safe = async (p) => {
    try { const res = await p; return res?.data?.data ?? res?.data ?? null; }
    catch (e) { throw parseAxiosError(e); }
};

// Exams
export const getTeacherExams = async (params = {}) =>
    safe(api.get('/api/exams/all', { params }));

export const updateExamStatus = async (examId, body) =>
    safe(api.put(`/api/exams/${encodeURIComponent(examId)}/update`, body));

// Issues
export const getTeacherIssues = async (params = {}) =>
    safe(api.get('/api/issues/all', { params }));

export const resolveTeacherIssue = async (issueId, body) =>
    safe(api.patch(`/api/issues/${encodeURIComponent(issueId)}/resolve`, body));

// Submissions (unchanged)