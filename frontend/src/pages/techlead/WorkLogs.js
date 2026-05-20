// src/pages/techlead/WorkLogs.js
import React, { useEffect, useState } from 'react';
import { getTeamWorkLogs } from '../../services/api';
import { Card, CardHeader, CardBody, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const TechLeadWorkLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try { const res = await getTeamWorkLogs(); setLogs(res.data.logs); }
      catch { toast.error('Failed to load work logs'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = logs.filter(l =>
    `${l.employee?.firstName} ${l.employee?.lastName} ${l.project?.title} ${l.description}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Team Work Logs" subtitle="Review daily work submissions from your team" />
      <Card>
        <CardHeader title={`${logs.length} log entries`}
          action={
            <input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
          }
        />
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No work logs found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Employee', 'Project', 'Date', 'Hours', 'Task Description'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(l => (
                    <tr key={l._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{l.employee?.firstName} {l.employee?.lastName}</p>
                        <p className="text-xs text-slate-400">{l.employee?.employeeId}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{l.project?.title}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(l.logDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{l.hours}h</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">{l.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TechLeadWorkLogs;
