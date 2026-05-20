// src/pages/techlead/Dashboard.js
import React, { useEffect, useState } from 'react';
import { getAllProjects, getMyTeam, getTeamLeaves } from '../../services/api';
import { StatCard, Card, CardHeader, CardBody, Badge, Spinner, PageHeader } from '../../components/common/UI';
import { FolderKanban, Users, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TechLeadDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, t, l] = await Promise.all([getAllProjects(), getMyTeam(), getTeamLeaves()]);
        setProjects(p.data.projects);
        setTeam(t.data.team);
        setLeaves(l.data.leaves.filter(lv => lv.status === 'pending'));
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;

  const myProjects = projects.filter(p => p.createdBy === user.id || p.createdBy?._id === user.id || String(p.createdBy) === user.id);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.profile?.firstName || 'Tech Lead'}`}
        subtitle={new Date().toDateString()}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="My Projects" value={myProjects.length} icon={FolderKanban} color="blue" />
        <StatCard title="Team Members" value={team.length} icon={Users} color="green" />
        <StatCard title="Pending Leaves" value={leaves.length} icon={CalendarDays} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="My Projects" />
          <CardBody className="p-0">
            {myProjects.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No projects created yet</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myProjects.slice(0, 5).map(p => (
                  <div key={p._id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{p.title}</p>
                      <p className="text-sm text-slate-500">{p.duration}</p>
                    </div>
                    <Badge status={p.isActive ? 'active' : 'rejected'} label={p.isActive ? 'Active' : 'Closed'} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pending Leave Requests" />
          <CardBody className="p-0">
            {leaves.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No pending requests</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaves.slice(0, 5).map(l => (
                  <div key={l._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">
                        {l.employee?.firstName} {l.employee?.lastName}
                      </p>
                      <Badge status="pending" />
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-400">{l.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default TechLeadDashboard;
