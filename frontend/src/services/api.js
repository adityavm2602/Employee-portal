// src/services/api.js — Axios instance with JWT interceptor
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────
export const login          = (data) => API.post('/auth/login', data);
export const getMe          = ()     => API.get('/auth/me');
export const changePassword = (data) => API.put('/auth/change-password', data);

// ── Admin ────────────────────────────────────────────
export const getDashboard   = ()         => API.get('/admin/dashboard');
export const getAllEmployees = ()         => API.get('/admin/employees');
export const addEmployee    = (data)     => API.post('/admin/employees', data);
export const updateEmployee = (id, data) => API.put(`/admin/employees/${id}`, data);
export const deleteEmployee = (id)       => API.delete(`/admin/employees/${id}`);
export const bulkUpload     = (formData) =>
  API.post('/admin/employees/bulk-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ── Projects ─────────────────────────────────────────
export const getAllProjects          = ()             => API.get('/projects');
export const getProject             = (id)           => API.get(`/projects/${id}`);
export const createProject          = (data)         => API.post('/projects', data);
export const updateProject          = (id, data)     => API.put(`/projects/${id}`, data);
export const deleteProject          = (id)           => API.delete(`/projects/${id}`);
export const getProjectApplications = (id)           => API.get(`/projects/${id}/applications`);
export const updateApplicationStatus= (pId,aId,status) =>
  API.patch(`/projects/${pId}/applications/${aId}`, { status });
export const getMyTeam              = ()             => API.get('/projects/my-team');

// ── Employee ─────────────────────────────────────────
export const getProfile        = ()          => API.get('/employee/profile');
export const applyForProject   = (projectId) => API.post(`/employee/apply/${projectId}`);
export const getMyApplications = ()          => API.get('/employee/applications');

// ── Work Logs ────────────────────────────────────────
export const createWorkLog   = (data) => API.post('/worklogs', data);
export const getMyWorkLogs   = ()     => API.get('/worklogs/my');
export const getTeamWorkLogs = ()     => API.get('/worklogs/team');

// ── Attendance ───────────────────────────────────────
export const markAttendance    = (status) => API.post('/attendance/mark', { status });
export const getMyAttendance   = ()       => API.get('/attendance/my');
export const getTeamAttendance = ()       => API.get('/attendance/team');
export const getAllAttendance   = (date)   =>
  API.get(`/attendance/all${date ? `?date=${date}` : ''}`);

// ── Leaves ───────────────────────────────────────────
export const applyLeave    = (data)             => API.post('/leaves', data);
export const getMyLeaves   = ()                 => API.get('/leaves/my');
export const getTeamLeaves = ()                 => API.get('/leaves/team');
export const getHRLeaves   = ()                 => API.get('/leaves/hr');
export const getAllLeaves   = ()                 => API.get('/leaves/all');

// Tech Lead reviews an employee's leave (Step 1)
export const tlLeaveReview = (id, status, comment = '') =>
  API.patch(`/leaves/${id}/tl-review`, { status, comment });

// HR gives final decision (Step 2)
export const hrLeaveReview = (id, status, comment = '') =>
  API.patch(`/leaves/${id}/hr-review`, { status, comment });

export default API;
