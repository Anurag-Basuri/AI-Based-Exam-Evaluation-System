import { apiClient, publicClient } from './api.js';
import { setToken } from '../utils/handleToken.js';

// --- Auth Services ---
export const registerStudent = async (studentData) => {
  const response = await publicClient.post('/api/students/register', studentData);
  if (response.data.data.authToken) {
    setToken({
      accessToken: response.data.data.authToken,
      refreshToken: response.data.data.refreshToken || null
    });
  }
  return response.data;
};

export const loginStudent = async (credentials) => {
  const response = await publicClient.post('/api/students/login', credentials);
  if (response.data.data.authToken) {
    setToken({
      accessToken: response.data.data.authToken,
      refreshToken: response.data.data.refreshToken || null
    });
  }
  return response.data;
};

export const logoutStudent = async () => {
  const response = await apiClient.post('/api/students/logout');
  setToken(null);
  return response.data;
};

export const registerTeacher = async (teacherData) => {
  const response = await publicClient.post('/api/teachers/register', teacherData);
  if (response.data.data.authToken) {
    setToken({
      accessToken: response.data.data.authToken,
      refreshToken: response.data.data.refreshToken || null
    });
  }
  return response.data;
};

export const loginTeacher = async (credentials) => {
  const response = await publicClient.post('/api/teachers/login', credentials);
  if (response.data.data.authToken) {
    setToken({
      accessToken: response.data.data.authToken,
      refreshToken: response.data.data.refreshToken || null
    });
  }
  return response.data;
};

export const logoutTeacher = async () => {
  const response = await apiClient.post('/api/teachers/logout');
  setToken(null);
  return response.data;
};