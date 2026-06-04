// src/pages/admin/TechLeadUpdates.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardBody, Spinner, EmptyState, PageHeader } from '../../components/common/UI';
import { ShieldAlert, Calendar, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

const TechLeadUpdates = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTLUpdates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/tech-lead-updates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch {
      toast.error('Failed to load Tech Lead updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTLUpdates();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader 
        title="Tech Lead Activities" 
        subtitle="Monitor high-level project updates and daily activities from Tech Leads"
      />

      <Card>
        <CardHeader title="Tech Lead Activity Streams" />
        <CardBody className="p-0">
          {logs.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No updates submitted by Tech Leads yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Tech Lead</th>
                    <th className="text-left px-4 py-3 w-1/3">First Half Activity</th>
                    <th className="text-left px-4 py-3 w-1/3">Second Half Activity</th>
                    <th className="text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* date */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>
                      
                      {/* tech lead name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {log.employee?.firstName} {log.employee?.lastName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wide mt-0.5">
                          <Terminal size={10} /> Tech Lead
                        </span>
                      </td>

                      {/* first half */}
                      <td className="px-4 py-3 font-medium text-xs leading-relaxed">
                        <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg">
                          {log.firstHalfReport || '—'}
                        </div>
                      </td>

                      {/* second half */}
                      <td className="px-4 py-3 font-medium text-xs leading-relaxed">
                        <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg">
                          {log.secondHalfReport || '—'}
                        </div>
                      </td>

                      {/* status tag */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      </td>
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

export default TechLeadUpdates;