import { apiClient, publicClient } from './api.js';
import { setToken } from '../utils/handleToken.js';

// --- Auth Services ---

export const login = async (credentials) => {
  const response = await publicClient.post('/api/v1/auth/login', credentials);
  if (response.data.data.token) {
    setToken({
      accessToken: response.data.data.token,
      refreshToken: response.data.data.refreshToken || null 
    });
  }
  return response.data;
};

export const registerStudent = async (studentData) => {
  const response = await publicClient.post('/api/v1/auth/register/student', studentData);
  if (response.data.data.token) {
    setToken({
      accessToken: response.data.data.token,
      refreshToken: response.data.data.refreshToken || null
    });
  }
  return response.data;
};

export const registerTeacher = async (teacherData) => {
  const response = await publicClient.post('/api/v1/auth/register/teacher', teacherData);
  if (response.data.data.token) {
    setToken({
      accessToken: response.data.data.token,
      refreshToken: response.data.data.refreshToken || null
    });
  }
  return response.data;
};

export const getMe = async () => {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data;
};

// --- Issue Services ---

export const createIssue = async (issueData) => {
    const response = await apiClient.post('/api/v1/issues', issueData);
    return response.data;
};

export const getStudentIssues = async () => {
    const response = await apiClient.get('/api/v1/issues/student');
    return response.data;
};

export const getTeacherIssues = async () => {
    const response = await apiClient.get('/api/v1/issues/teacher');
    return response.data;
};

export const replyToIssue = async (issueId, replyText) => {
    const response = await apiClient.put(`/api/v1/issues/${issueId}/reply`, { reply: replyText });
    return response.data;
};

export const createTimetableEntry = async (entryData) => {
  // Use the new '/teacher/timetable' route
  const response = await apiClient.post('/api/v1/teacher/timetable', entryData);
  return response.data;
};



// This function is for the STUDENT to fetch their timetable
export const getStudentTimetable = async () => {
  const response = await apiClient.get('/api/v1/student/timetable');
  return response.data;
};

export const createExamWithQuestions = async (examData) => {
  // This uses the apiClient which automatically includes the teacher's auth token
  const response = await apiClient.post('/api/v1/teacher/exams', examData);
  return response.data;
};

export const getTeacherExams = async () => {
  const response = await apiClient.get('/api/v1/teacher/exams');
  return response.data;
};


export const getExamDetails = async (examId) => {
  const response = await apiClient.get(`/api/v1/teacher/exams/${examId}`);
  return response.data;
};

export const deleteExam = async (examId) => {
  const response = await apiClient.delete(`/api/v1/teacher/exams/${examId}`);
  return response.data;
};



export const getActiveExams = async () => {
  const response = await apiClient.get('/api/v1/student/exams/active');
  return response.data;
};

export const startExam = async (examId, accessCode) => {
  const response = await apiClient.post(`/api/v1/student/exams/${examId}/start`, { accessCode });
  return response.data;
};

export const submitExam = async (submissionId, answers) => {
  const response = await apiClient.put(`/api/v1/student/submissions/${submissionId}/submit`, { answers });
  return response.data;
};

// ✅ ADD THIS NEW FUNCTION
export const getSubmissionById = async (submissionId) => {
  const response = await apiClient.get(`/api/v1/student/submissions/session/${submissionId}`);
  return response.data;
};


export const getExamSubmissions = async (examId) => {
  const response = await apiClient.get(`/api/v1/teacher/exams/${examId}/submissions`);
  return response.data;
};

export const evaluateAnswerWithAI = async (submissionId, questionId) => {
  const response = await apiClient.post('/api/v1/teacher/submissions/evaluate-ai', { submissionId, questionId });
  return response.data;
};


export const publishResults = async (examId) => {
  const response = await apiClient.post(`/api/v1/teacher/exams/${examId}/publish-results`);
  return response.data;
};

export const getStudentResults = async () => {
  const response = await apiClient.get('/api/v1/student/results');
  return response.data;
};


export const getDashboardStats = async () => {
  const response = await apiClient.get('/api/v1/dashboard/stats');
  return response.data;
};

export const getRecentActivity = async () => {
  const response = await apiClient.get('/api/v1/dashboard/activity');
  return response.data;
};

// --- To-Do List Services ---

export const getTodos = async () => {
  const response = await apiClient.get('/api/v1/dashboard/todos');
  return response.data;
};

export const addTodo = async (text) => {
  const response = await apiClient.post('/api/v1/dashboard/todos', { text });
  return response.data;
};

export const toggleTodo = async (todoId) => {
  const response = await apiClient.patch(`/api/v1/dashboard/todos/${todoId}`);
  return response.data;
};

export const deleteTodo = async (todoId) => {
  const response = await apiClient.delete(`/api/v1/dashboard/todos/${todoId}`);
  return response.data;
};
