import axios from "axios";

// =======================================
// AXIOS INSTANCE
// =======================================

const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000/api",
});

// =======================================
// ADD TOKEN AUTOMATICALLY
// =======================================

API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");

    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =======================================
// TEAM MEMBERS
// =======================================

export const getTeamMembers = async () => {
  return await API.get("/techlead/team");
};

// =======================================
// PROJECTS
// =======================================

export const getAssignedProjects = async () => {
  return await API.get("/techlead/projects");
};

// =======================================
// DAILY UPDATES
// =======================================

export const getEmployeeUpdates = async () => {
  return await API.get("/techlead/updates");
};

export const submitDailyUpdate = async (
  data
) => {
  return await API.post(
    "/techlead/daily-update",
    data
  );
};

// =======================================
// FEEDBACK / COMMENTS
// =======================================

export const addFeedback = async (
  employeeId,
  updateIndex,
  comment
) => {
  return await API.post(
    "/techlead/comment",
    {
      employeeId,
      updateIndex,
      comment,
    }
  );
};

// =======================================
// LEAVE REQUESTS
// =======================================

export const getLeaveRequests = async () => {
  return await API.get("/techlead/leaves");
};

export const approveLeave = async (
  employeeId,
  leaveIndex
) => {
  return await API.put(
    "/techlead/leave/approve",
    {
      employeeId,
      leaveIndex,
    }
  );
};

export const rejectLeave = async (
  employeeId,
  leaveIndex
) => {
  return await API.put(
    "/techlead/leave/reject",
    {
      employeeId,
      leaveIndex,
    }
  );
};

// =======================================
// PROJECT PROGRESS
// =======================================

export const updateProjectProgress =
  async (projectId, progress) => {
    return await API.put(
      `/techlead/project/progress/${projectId}`,
      {
        progress,
      }
    );
  };