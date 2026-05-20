// src/pages/techlead/Team.js
import React, { useEffect, useState } from 'react';
import { getMyTeam, getTeamWorkLogs } from '../../services/api';
import { Card, CardBody, Badge, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';

const Team = () => {
  const [team, setTeam] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('members');

  useEffect(() => {
    (async () => {
      try {
        const [t, l] = await Promise.all([getMyTeam(), getTeamWorkLogs()]);
        setTeam(t.data.team);
        setLogs(l.data.logs);
      } catch { toast.error('Failed to load team data'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="My Team" subtitle={`${team.length} members across your projects`} />

      <div className="flex gap-2 mb-5">
        {['members', 'worklogs'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
              ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t === 'members' ? 'Team Members' : 'Work Logs'}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <Card>
          <CardBody className="p-0">
            {team.length === 0 ? (
              <EmptyState icon={Users} title="No team members yet" description="Accept applications to build your team" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Name', 'Employee ID', 'Email', 'Status', 'Project'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {team.map(m => (
                      <tr key={m._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {m.firstName?.[0]}{m.lastName?.[0]}
                            </div>
                            <span className="font-medium text-slate-800">{m.firstName} {m.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{m.employeeId}</td>
                        <td className="px-4 py-3 text-slate-500">{m.officialEmail}</td>
                        <td className="px-4 py-3"><Badge status={m.status} /></td>
                        <td className="px-4 py-3 text-slate-500">{m.currentProject?.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'worklogs' && (
        <Card>
          <CardBody className="p-0">
            {logs.length === 0 ? (
              <EmptyState icon={Users} title="No work logs yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Employee', 'Project', 'Date', 'Hours', 'Description'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map(l => (
                      <tr key={l._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {l.employee?.firstName} {l.employee?.lastName}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{l.project?.title}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(l.logDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{l.hours}h</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-[300px] truncate">{l.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default Team;
