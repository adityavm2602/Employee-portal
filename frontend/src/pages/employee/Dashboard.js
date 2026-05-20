// src/pages/employee/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, getMyApplications, getMyLeaves, getMyAttendance } from '../../services/api';
import { StatCard, Card, CardHeader, CardBody, Badge, Button, Spinner, PageHeader } from '../../components/common/UI';
import { Briefcase, CheckSquare, CalendarDays, UserCheck, KeyRound, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, a, l, att] = await Promise.all([
          getProfile(), getMyApplications(), getMyLeaves(), getMyAttendance()
        ]);
        setProfile(p.data.employee);
        setApps(a.data.applications);
        setLeaves(l.data.leaves);
        setAttendance(att.data.attendance);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;

  const presentDays = attendance.filter(a => a.status === 'present').length;

  // Show banner if user hasn't changed default password yet
  // We detect this by checking a localStorage flag set after first change
  const isDefaultPassword = !localStorage.getItem(`pwd_changed_${user?.id}`);

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

      {/* Recent applications */}
      <Card>
        <CardHeader title="My Recent Applications" />
        <CardBody className="p-0">
          {apps.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No applications yet — browse Projects to apply</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {apps.slice(0, 5).map(app => (
                <div key={app._id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{app.project?.title}</p>
                    <p className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
