 admin-feature
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Auth
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import BulkUpload from './pages/admin/BulkUpload';
import AdminAttendance from './pages/admin/Attendance';
 Employee-dashboard
import AdminLeaves     from './pages/admin/Leaves';
import AdminWorkReports from './pages/admin/WorkReports';

import AdminLeaves from './pages/admin/Leaves';
import TechLeadUpdates from './pages/admin/TechLeadUpdates';
import AdminWorkLogs from './pages/admin/WorkLogs';
 main

// Tech Lead
import TechLeadDashboard from './pages/techlead/Dashboard';
import Projects from './pages/techlead/Projects';
import Team from './pages/techlead/Team';
import TechLeadWorkLogs from './pages/techlead/WorkLogs';
import TechLeadAttendance from './pages/techlead/Attendance';
import TechLeadLeaves from './pages/techlead/Leaves';
import MyLeaves from './pages/techlead/MyLeaves';
import React from "react";
 main

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import ProtectedRoute from "./components/common/ProtectedRoute";

import Layout from "./components/layout/Layout";

// =======================================
// AUTH
// =======================================

import Login from "./pages/auth/Login";
import ChangePassword from "./pages/auth/ChangePassword";

// =======================================
// ADMIN
// =======================================

import AdminDashboard from "./pages/admin/Dashboard";
import Employees from "./pages/admin/Employees";
import BulkUpload from "./pages/admin/BulkUpload";
import AdminAttendance from "./pages/admin/Attendance";
import AdminLeaves from "./pages/admin/Leaves";

// =======================================
// TECH LEAD
// =======================================

import TechLeadDashboard from "./pages/techlead/Dashboard";
import Projects from "./pages/techlead/Projects";
import Team from "./pages/techlead/Team";
import TechLeadWorkLogs from "./pages/techlead/WorkLogs";
import TechLeadAttendance from "./pages/techlead/Attendance";
import TechLeadLeaves from "./pages/techlead/Leaves";
import MyLeaves from "./pages/techlead/MyLeaves";

// =======================================
// HR
 Employee-dashboard
import HRDashboard  from './pages/hr/Dashboard';
import HRLeaves     from './pages/hr/Leaves';
import HREmployees  from './pages/hr/Employees';

// Employee
import EmployeeDashboard  from './pages/employee/Dashboard';
import EmployeeProjects   from './pages/employee/Projects';
import Applications       from './pages/employee/Applications';
import WorkLogs           from './pages/employee/WorkLogs';
import Attendance         from './pages/employee/Attendance';
import Leaves             from './pages/employee/Leaves';
import DailyUpdates       from './pages/employee/DailyUpdates';
import Profile            from './pages/employee/Profile';
import Notifications      from './pages/employee/Notifications';

// =======================================

import HRDashboard from "./pages/hr/Dashboard";
import HRLeaves from "./pages/hr/Leaves";
import HREmployees from "./pages/hr/Employees";

// =======================================
// EMPLOYEE
// =======================================

import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeProjects from "./pages/employee/Projects";
import Applications from "./pages/employee/Applications";
import WorkLogs from "./pages/employee/WorkLogs";
import Attendance from "./pages/employee/Attendance";
import Leaves from "./pages/employee/Leaves";

// =======================================
// ROOT REDIRECT
// =======================================
 main

const RootRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes = {
    admin: "/admin/dashboard",
    tech_lead: "/techlead/dashboard",
    hr: "/hr/dashboard",
    employee: "/employee/dashboard",
  };

  return (
    <Navigate
      to={roleRoutes[user.role] || "/login"}
      replace
    />
  );
};

// =======================================
// APP
// =======================================

export default function App() {
  return (
    <AuthProvider>
 Employee-dashboard
      <SocketProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

      <BrowserRouter>

        {/* TOASTER */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />

 main
        <Routes>

          {/* =======================================
              PUBLIC ROUTES
          ======================================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/"
            element={<RootRedirect />}
          />

          {/* =======================================
              ADMIN ROUTES
          ======================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
              />
            }
          >
            <Route element={<Layout />}>

              <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
              />

              <Route
                path="/admin/employees"
                element={<Employees />}
              />

              <Route
                path="/admin/bulk-upload"
                element={<BulkUpload />}
              />

              <Route
                path="/admin/attendance"
                element={<AdminAttendance />}
              />

              <Route
                path="/admin/leaves"
                element={<AdminLeaves />}
              />
 admin-feature
              <Route
                path="/admin/TechLeadUpdates"
                element={<TechLeadUpdates />}
              />

              <Route
                path="/admin/worklogs"
                element={<AdminWorkLogs />}
              />
                  

         main
            </Route>
          </Route>

          {/* =======================================
              TECH LEAD ROUTES
          ======================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["tech_lead"]}
              />
            }
          >
            <Route element={<Layout />}>
 Employee-dashboard
              <Route path="/admin/dashboard"   element={<AdminDashboard />} />
              <Route path="/admin/employees"   element={<Employees />} />
              <Route path="/admin/bulk-upload" element={<BulkUpload />} />
              <Route path="/admin/attendance"  element={<AdminAttendance />} />
              <Route path="/admin/leaves"      element={<AdminLeaves />} />
              <Route path="/admin/daily-updates" element={<AdminWorkReports />} />
              <Route path="/admin/time-tracking" element={<AdminWorkReports />} />


              <Route
                path="/techlead"
                element={
                  <Navigate
                    to="/techlead/dashboard"
                    replace
                  />
                }
              />

              <Route
                path="/techlead/dashboard"
                element={<TechLeadDashboard />}
              />

              <Route
                path="/techlead/projects"
                element={<Projects />}
              />

              <Route
                path="/techlead/team"
                element={<Team />}
              />

              <Route
                path="/techlead/worklogs"
                element={<TechLeadWorkLogs />}
              />

              <Route
                path="/techlead/attendance"
                element={<TechLeadAttendance />}
              />

              <Route
                path="/techlead/leaves"
                element={<TechLeadLeaves />}
              />

              <Route
                path="/techlead/my-leaves"
                element={<MyLeaves />}
              />

 main
            </Route>
          </Route>

          {/* =======================================
              HR ROUTES
          ======================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["hr"]}
              />
            }
          >
            <Route element={<Layout />}>
 Employee-dashboard
              <Route path="/techlead/dashboard"  element={<TechLeadDashboard />} />
              <Route path="/techlead/projects"   element={<Projects />} />
              <Route path="/techlead/team"       element={<Team />} />
              <Route path="/techlead/worklogs"   element={<TechLeadWorkLogs />} />
              <Route path="/techlead/attendance" element={<TechLeadAttendance />} />
              <Route path="/techlead/leaves"     element={<TechLeadLeaves />} />
              <Route path="/techlead/my-leaves"  element={<MyLeaves />} />


              <Route
                path="/hr/dashboard"
                element={<HRDashboard />}
              />

              <Route
                path="/hr/leaves"
                element={<HRLeaves />}
              />

              <Route
                path="/hr/employees"
                element={<HREmployees />}
              />

 main
            </Route>
          </Route>

          {/* =======================================
              EMPLOYEE ROUTES
          ======================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["employee"]}
              />
            }
          >
            <Route element={<Layout />}>
 Employee-dashboard
              <Route path="/hr/dashboard"  element={<HRDashboard />} />
              <Route path="/hr/leaves"     element={<HRLeaves />} />
              <Route path="/hr/employees"  element={<HREmployees />} />


              <Route
                path="/employee/dashboard"
                element={<EmployeeDashboard />}
              />

              <Route
                path="/employee/projects"
                element={<EmployeeProjects />}
              />

              <Route
                path="/employee/applications"
                element={<Applications />}
              />

              <Route
                path="/employee/worklogs"
                element={<WorkLogs />}
              />

              <Route
                path="/employee/attendance"
                element={<Attendance />}
              />

              <Route
                path="/employee/leaves"
                element={<Leaves />}
              />

 main
            </Route>
          </Route>

          {/* =======================================
              CHANGE PASSWORD
          ======================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "tech_lead",
                  "hr",
                  "employee",
                ]}
              />
            }
          >
            <Route element={<Layout />}>
 Employee-dashboard
              <Route path="/employee/dashboard"    element={<EmployeeDashboard />} />
              <Route path="/employee/projects"     element={<EmployeeProjects />} />
              <Route path="/employee/applications" element={<Applications />} />
              <Route path="/employee/worklogs"     element={<WorkLogs />} />
              <Route path="/employee/attendance"   element={<Attendance />} />
              <Route path="/employee/leaves"       element={<Leaves />} />
            </Route>
          </Route>

          {/* ── Shared (Admin & Employee) Daily Updates ──── */}
          <Route element={<ProtectedRoute allowedRoles={['employee', 'admin']} />}>
            <Route element={<Layout />}>
              <Route path="/daily-updates"         element={<DailyUpdates />} />
              <Route path="/time-tracking"         element={<DailyUpdates />} />
            </Route>
          </Route>

          {/* ── Change Password & Profile & Notifications — shared by ALL authenticated roles ─ */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/profile"         element={<Profile />} />
              <Route path="/notifications"   element={<Notifications />} />


              <Route
                path="/change-password"
                element={<ChangePassword />}
              />

 main
            </Route>
          </Route>

          {/* =======================================
              UNAUTHORIZED PAGE
          ======================================= */}

          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">

                  <p className="text-6xl font-bold text-slate-200 mb-4">
                    403
                  </p>

                  <h1 className="text-xl font-semibold text-slate-700">
                    Access Denied
                  </h1>

                  <a
                    href="/"
                    className="mt-4 inline-block text-blue-600 hover:underline"
                  >
                    ← Go Home
                  </a>

                </div>
              </div>
            }
          />

          {/* =======================================
              404 PAGE
          ======================================= */}

          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">

                  <p className="text-6xl font-bold text-slate-200 mb-4">
                    404
                  </p>

                  <h1 className="text-xl font-semibold text-slate-700">
                    Page Not Found
                  </h1>

                  <a
                    href="/"
                    className="mt-4 inline-block text-blue-600 hover:underline"
                  >
                    ← Go Home
                  </a>

                </div>
              </div>
            }
          />

        </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}