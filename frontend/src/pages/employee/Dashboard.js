// src/pages/employee/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, getMyApplications, getMyLeaves, getMyAttendance, getTodayDailyWorkLog } from '../../services/api';
import { StatCard, Card, CardHeader, CardBody, Badge, Button, Spinner, PageHeader } from '../../components/common/UI';
import { Briefcase, CheckSquare, CalendarDays, UserCheck, KeyRound, AlertTriangle, CheckCircle2, AlertCircle, FileEdit, Clock, Bell, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useSocket();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [todayWorkLog, setTodayWorkLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, a, l, att, worklogRes] = await Promise.all([
          getProfile(),
          getMyApplications(),
          getMyLeaves(),
          getMyAttendance(),
          getTodayDailyWorkLog()
        ]);
        setProfile(user?.profile);
        setApps(a.data.applications);
        setLeaves(l.data.leaves);
        setAttendance(att.data.attendance);
        setTodayWorkLog(worklogRes.data.worklog);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <Spinner />;

  const presentDays = attendance.filter(a => a.status === 'present').length;

  // Show banner if user hasn't changed default password yet
  const isDefaultPassword = !localStorage.getItem(`pwd_changed_${user?.id}`);

  // Calculate Daily Update status and progress
  const isSubmitted = todayWorkLog?.isFinalSubmitted || false;
  const isDraft = !isSubmitted && todayWorkLog?.status === 'In Progress';

  const firstHalfStatus = todayWorkLog 
    ? (todayWorkLog.isFinalSubmitted ? 'Submitted' : (todayWorkLog.firstHalfUpdate?.trim() ? 'Draft' : 'Pending'))
    : 'Pending';
  const secondHalfStatus = todayWorkLog 
    ? (todayWorkLog.isFinalSubmitted ? 'Submitted' : (todayWorkLog.secondHalfUpdate?.trim() ? 'Draft' : 'Pending'))
    : 'Pending';

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.firstName || 'Employee'}!`} subtitle={new Date().toDateString()} />

      {/* ⚠️ First-login password change banner */}
      {isDefaultPassword && (
        <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-300 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={22} />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Change your default password</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Your current password is your <strong>Employee ID</strong>. Please set a secure password now.
              </p>
            </div>
          </div>
          <Button size="sm" variant="warning" onClick={() => navigate('/change-password')}>
            <KeyRound size={14} /> Change Now
          </Button>
        </div>
      )}

      {/* Profile card */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800">{profile?.firstName} {profile?.lastName}</h3>
              <p className="text-slate-500">{profile?.employeeId} · {profile?.officialEmail}</p>
              <div className="flex gap-2 mt-2">
                <Badge status={profile?.status} />
                {profile?.currentProject?.title && (
                  <Badge status="active" label={profile.currentProject.title} />
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard title="Applications"  value={apps.length}                                  icon={CheckSquare}  color="blue" />
        <StatCard title="Accepted"      value={apps.filter(a => a.status === 'accepted').length} icon={Briefcase} color="green" />
        <StatCard title="Days Present"  value={presentDays}                                  icon={UserCheck}    color="purple" />
        <StatCard title="Leave Requests" value={leaves.length}                               icon={CalendarDays} color="amber" />
      </div>

      {/* Main Grid: Daily Updates Widget + Notifications Widget + Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Update Status Widget */}
        <Card className="lg:col-span-1 border-blue-100 shadow-sm flex flex-col justify-between">
          <CardHeader title="Daily Update Status" />
          <CardBody className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm font-medium">Today's Update:</span>
                {isSubmitted ? (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                    <CheckCircle2 size={12} className="shrink-0" /> Submitted
                  </span>
                ) : isDraft ? (
                  <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-200">
                    <Clock size={12} className="shrink-0" /> Draft
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold border border-red-200">
                    <AlertCircle size={12} className="shrink-0" /> Pending
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Progress Details</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">First Half:</span>
                  {firstHalfStatus === 'Submitted' ? (
                    <span className="font-semibold text-green-600">Submitted</span>
                  ) : firstHalfStatus === 'Draft' ? (
                    <span className="font-semibold text-amber-500">Draft</span>
                  ) : (
                    <span className="font-semibold text-slate-400">Pending</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Second Half:</span>
                  {secondHalfStatus === 'Submitted' ? (
                    <span className="font-semibold text-green-600">Submitted</span>
                  ) : secondHalfStatus === 'Draft' ? (
                    <span className="font-semibold text-amber-500">Draft</span>
                  ) : (
                    <span className="font-semibold text-slate-400">Pending</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100">
              <Button onClick={() => navigate('/daily-updates')} className="w-full flex items-center justify-center gap-2" variant={isSubmitted ? 'secondary' : 'primary'}>
                <FileEdit size={14} /> {isSubmitted ? 'View Updates' : 'Update Now'}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Notifications Widget */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm flex flex-col justify-between">
          <CardHeader
            title="Recent Notifications"
            action={
              unreadCount > 0 ? (
                <span className="bg-red-500 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                  {unreadCount} New
                </span>
              ) : null
            }
          />
          <CardBody className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[180px] pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Bell size={24} className="mx-auto text-slate-300 mb-2 opacity-50" />
                  No notifications yet.
                </div>
              ) : (
                notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-2.5 rounded-lg border text-xs transition-colors flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 ${
                      notif.isRead ? 'border-slate-100' : 'border-blue-100 bg-blue-50/20'
                    }`}
                    onClick={() => navigate('/notifications')}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-700 truncate">{notif.title}</p>
                      <p className="text-slate-500 line-clamp-1 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                        By {notif.senderName}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Latest Announcement Highlight Banner */}
            {notifications.find(n => n.priority === 'high' || n.type === 'announcement') && (
              <div className="p-3 bg-red-50/40 border border-red-100 rounded-lg text-xs flex items-start gap-2">
                <Megaphone size={14} className="text-red-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-red-800">Latest Announcement</p>
                  <p className="text-red-700 line-clamp-2 mt-0.5">
                    {notifications.find(n => n.priority === 'high' || n.type === 'announcement')?.message}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 mt-auto border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/notifications')}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <Bell size={13} /> View All Messages
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Recent applications */}
        <Card className="lg:col-span-1 shadow-sm flex flex-col justify-between">
          <CardHeader title="My Recent Applications" />
          <CardBody className="p-0 flex-1 flex flex-col justify-between">
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[300px]">
              {apps.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No applications yet — browse Projects to apply</p>
              ) : (
                apps.slice(0, 5).map(app => (
                  <div key={app._id} className="px-6 py-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-medium text-slate-800 truncate text-sm">{app.project?.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge status={app.status} />
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
