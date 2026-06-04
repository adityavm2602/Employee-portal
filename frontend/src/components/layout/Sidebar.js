// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  LayoutDashboard, Users, FolderKanban, ClipboardList,
  CalendarDays, LogOut, ChevronLeft, ChevronRight,
  UserCheck, FileUp, Briefcase, CheckSquare, KeyRound,
  ShieldCheck, UserCog, FileText, Clock, User, Bell
} from 'lucide-react';

const navConfig = {
  admin: [
    { to: '/admin/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/admin/employees',    label: 'Employees',       icon: Users },
    {to: "/admin/techleadupdates",label: "TechLeadUpdates",icon: FolderKanban,},
    {to: "/admin/worklogs",label: "Work Logs",icon: ClipboardList,},
    { to: '/admin/bulk-upload',  label: 'Bulk Upload',     icon: FileUp },
    { to: '/admin/attendance',   label: 'Attendance',      icon: UserCheck },
    { to: '/admin/leaves',       label: 'All Leaves',      icon: CalendarDays },
 Employee-dashboard
    { to: '/admin/daily-updates', label: 'Daily Updates',    icon: FileText },
    { to: '/admin/time-tracking', label: 'Time Tracking & History', icon: Clock },
    { to: '/profile',            label: 'My Profile',      icon: User, divider: true },
    { to: '/notifications',      label: 'Notifications',   icon: Bell, badge: true },
    { to: '/change-password',    label: 'Change Password', icon: KeyRound },

    { to: '/change-password',    label: 'Change Password', icon: KeyRound, divider: true },

 main
  ],
  tech_lead: [
    { to: '/techlead/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/techlead/projects',    label: 'Projects',        icon: FolderKanban },
    { to: '/techlead/team',        label: 'My Team',         icon: Users },
    { to: '/techlead/worklogs',    label: 'Work Logs',       icon: ClipboardList },
    { to: '/techlead/attendance',  label: 'Attendance',      icon: UserCheck },
    { to: '/techlead/leaves',      label: 'Team Leaves',     icon: CalendarDays },
    { to: '/techlead/my-leaves',   label: 'My Leaves',       icon: CalendarDays, divider: true },
    { to: '/profile',              label: 'My Profile',      icon: User },
    { to: '/notifications',        label: 'Notifications',   icon: Bell, badge: true },
    { to: '/change-password',      label: 'Change Password', icon: KeyRound },
  ],
  hr: [
    { to: '/hr/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/hr/leaves',          label: 'Leave Approvals', icon: ShieldCheck },
    { to: '/hr/employees',       label: 'All Employees',   icon: UserCog },
    { to: '/profile',            label: 'My Profile',      icon: User, divider: true },
    { to: '/notifications',      label: 'Notifications',   icon: Bell, badge: true },
    { to: '/change-password',    label: 'Change Password', icon: KeyRound },
  ],
  employee: [
    { to: '/employee/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/employee/projects',     label: 'Projects',        icon: Briefcase },
    { to: '/employee/applications', label: 'My Applications', icon: CheckSquare },
    { to: '/employee/worklogs',     label: 'Work Logs',       icon: ClipboardList },
    { to: '/employee/attendance',   label: 'Attendance',      icon: UserCheck },
    { to: '/employee/leaves',       label: 'Leaves',          icon: CalendarDays },
    { to: '/daily-updates',         label: 'Daily Updates',    icon: FileText },
    { to: '/time-tracking',         label: 'Time Tracking & History', icon: Clock },
    { to: '/profile',               label: 'My Profile',      icon: User, divider: true },
    { to: '/notifications',         label: 'Notifications',   icon: Bell, badge: true },
    { to: '/change-password',       label: 'Change Password', icon: KeyRound },
  ],
};

const roleBadge = {
  admin:     { label: 'Admin',     color: 'bg-purple-100 text-purple-700' },
  tech_lead: { label: 'Tech Lead', color: 'bg-blue-100 text-blue-700' },
  hr:        { label: 'HR Manager',color: 'bg-rose-100 text-rose-700' },
  employee:  { label: 'Employee',  color: 'bg-green-100 text-green-700' },
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = navConfig[user?.role] || [];
  const badge    = roleBadge[user?.role];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen shrink-0`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && <span className="font-bold text-lg tracking-tight text-white">EmpPortal</span>}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white ml-auto">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.profile?.firstName || user?.email}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge?.color}`}>
                {badge?.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 mt-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, divider, badge }) => (
          <React.Fragment key={to}>
            {divider && !collapsed && (
              <div className="border-t border-slate-700 my-2" />
            )}
            <NavLink to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                 ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <Icon size={18} />
                {collapsed && badge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900 animate-pulse"></span>
                )}
              </div>
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && badge && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </React.Fragment>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-slate-700">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors">
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
