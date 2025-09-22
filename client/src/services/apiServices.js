import { apiClient, publicClient } from './api.js';
import { setToken, removeToken } from '../utils/handleToken.js';

// Error type to normalize thrown errors
class ApiError extends Error {
    constructor(message, meta = {}) {
        super(message || 'Request failed');
        this.name = 'ApiError';
        this.status = meta.status ?? null;
        this.code = meta.code ?? null; // Axios error code (e.g., ERR_NETWORK)
        this.data = meta.data ?? null; // server-provided payload
        this.url = meta.url ?? null;
        this.method = meta.method ?? null;
    }
}

const parseAxiosError = (err) => {
    // Axios-like error shape
    const resp = err?.response;
    const req = err?.config;
    const message =
        resp?.data?.message ||
        resp?.data?.error ||
        err?.message ||
        'Unknown error';

    return new ApiError(message, {
        status: resp?.status,
        code: err?.code || resp?.data?.code || null,
        data: resp?.data ?? null,
        url: req?.url || req?.baseURL ? `${req?.baseURL || ''}${req?.url || ''}` : null,
        method: req?.method || null,
    });
};

// Remove tokens on unauthorized/forbidden
const maybeInvalidateToken = (error) => {
    if (error?.status === 401 || error?.status === 403) {
        removeToken();
    }
};

// Extract and store tokens from success responses
const applyTokensFromResponse = (response) => {
    const authToken = response?.data?.data?.authToken;
    const refreshToken = response?.data?.data?.refreshToken || null;

    if (authToken) {
        setToken({ accessToken: authToken, refreshToken });
        return true;
    }
    return false;
};

// Wrap calls and normalize thrown errors
export const safeApiCall = async (fn, ...args) => {
    try {
        return await fn(...args);
    } catch (err) {
        const apiErr = parseAxiosError(err);
        console.error('API call error:', {
            message: apiErr.message,
            status: apiErr.status,
            code: apiErr.code,
            url: apiErr.url,
            method: apiErr.method,
        });
        maybeInvalidateToken(apiErr);
        throw apiErr;
    }
};

// --- Auth Services ---
export const registerStudent = async (studentData) => {
    try {
        const response = await publicClient.post('/api/students/register', studentData);
        const hasTokens = applyTokensFromResponse(response);
        if (!hasTokens) removeToken(); // defensive: registration should return tokens
        return response.data;
    } catch (err) {
        const apiErr = parseAxiosError(err);
        maybeInvalidateToken(apiErr);
        throw apiErr;
    }
};

export const loginStudent = async (credentials) => {
    try {
        const response = await publicClient.post('/api/students/login', credentials);
        const hasTokens = applyTokensFromResponse(response);
        if (!hasTokens) removeToken();
        return response.data;
    } catch (err) {
        const apiErr = parseAxiosError(err);
        maybeInvalidateToken(apiErr);
        throw apiErr;
    }
};

export const logoutStudent = async () => {
    try {
        const response = await apiClient.post('/api/students/logout');
        removeToken();
        return response.data;
    } catch (err) {
        const apiErr = parseAxiosError(err);
        // On any logout error, ensure tokens are cleared
        removeToken();
        throw apiErr;
    }
};

export const registerTeacher = async (teacherData) => {
    try {
        const response = await publicClient.post('/api/teachers/register', teacherData);
        const hasTokens = applyTokensFromResponse(response);
        if (!hasTokens) removeToken();
        return response.data;
    } catch (err) {
        const apiErr = parseAxiosError(err);
        maybeInvalidateToken(apiErr);
        throw apiErr;
    }
};

export const loginTeacher = async (credentials) => {
    try {
        const response = await publicClient.post('/api/teachers/login', credentials);
        const hasTokens = applyTokensFromResponse(response);
        if (!hasTokens) removeToken();
        return response.data;
    } catch (err) {
        const apiErr = parseAxiosError(err);
        maybeInvalidateToken(apiErr);
        throw apiErr;
    }
};

export const logoutTeacher = async () => {
    try {
        const response = await apiClient.post('/api/teachers/logout');
        removeToken();
        return response.data;
    } catch (err) {
        const apiErr = parseAxiosError(err);
        removeToken();
        throw apiErr;
    }
};