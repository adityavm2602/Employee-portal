// src/services/api.js — Axios instance with JWT interceptor
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API ERROR:', error.response);

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
export const resetToEmployeeId = (employeeId) => API.post('/auth/reset-to-employeeid', { employeeId });

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

// ── Profile Management ────────────────────────────────
export const getProfile           = ()          => API.get('/profile');
export const updateProfile        = (data)      => API.put('/profile/update', data);
export const uploadProfileImage   = (formData)  => API.post('/profile/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const changeProfilePassword = (data)     => API.put('/profile/change-password', data);

// ── Notifications ─────────────────────────────────────
export const sendNotification     = (data)      => API.post('/notifications/send', data);
export const getNotifications     = (params)    => API.get('/notifications', { params });
export const markNotificationRead = (id)        => API.put(`/notifications/read/${id}`);
export const deleteNotification   = (id)        => API.delete(`/notifications/${id}`);
export const getUnreadCount       = ()          => API.get('/notifications/unread-count');

// ── Employee ─────────────────────────────────────────
export const applyForProject   = (projectId) => API.post(`/employee/apply/${projectId}`);
export const getMyApplications = ()          => API.get('/employee/applications');
export const getEmployeeList   = ()          => API.get('/employee/list');

// ── Daily Updates ────────────────────────────────────
export const createDailyUpdate   = (data)     => API.post('/daily-updates', data);
export const getTodayDailyUpdate = ()         => API.get('/daily-updates/today');
export const getDailyUpdateHistory = (params) => API.get('/daily-updates/history', { params });
export const updateDailyUpdate   = (id, data) => API.put(`/daily-updates/${id}`, data);

// ── Smart Daily Work Logs & Time Tracking ──────────────
export const createDailyWorkLog       = ()         => API.post('/worklog/create');
export const getTodayDailyWorkLog     = ()         => API.get('/worklog/today');
export const getDailyWorkLogHistory   = (params)   => API.get('/worklog/history', { params });
export const updateDailyWorkLog       = (id, data) => API.put(`/worklog/update/${id}`, data);
export const getEmployeeWorkLogReport = ()         => API.get('/worklog/report');
export const getAdminWorklogAnalytics = ()         => API.get('/admin/worklog/analytics');

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
export const getTechLeads   = ()                 => API.get('/leaves/tech-leads');
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
