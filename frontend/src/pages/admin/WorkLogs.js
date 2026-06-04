// src/pages/admin/WorkLogs.js
import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import { Card, CardHeader, CardBody, Spinner, EmptyState, PageHeader } from '../../components/common/UI';
import { ClipboardList, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/work-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      toast.error('Failed to load work reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkLogs();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader 
        title="Daily Work Reports" 
        subtitle="Monitor First Half and Second Half updates submitted by employees"
      />

      <Card>
        <CardHeader title="Employee Activity Logs" />
        <CardBody className="p-0">
          {logs.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No work reports submitted today" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Employee Details</th>
                    <th className="text-left px-4 py-3 w-1/3">First Half Report (Task & Progress)</th>
                    <th className="text-left px-4 py-3 w-1/3">Second Half Report (Task & Progress)</th>
                    <th className="text-left px-4 py-3">Hours Worked</th>
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
                      
                      {/* information */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 block">
                          {log.employee?.firstName} {log.employee?.lastName}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {log.employee?.employeeId || 'EMP-101'}
                        </span>
                      </td>

                      {/* first half report*/}
                      <td className="px-4 py-3 vertical-top">
                        <div className="bg-blue-50/40 border border-blue-100/50 p-2.5 rounded-lg text-xs leading-relaxed">
                          {log.firstHalfReport ? log.firstHalfReport : <span className="text-slate-400 italic">Not submitted</span>}
                        </div>
                      </td>

                      {/* second half report */}
                      <td className="px-4 py-3 vertical-top">
                        <div className="bg-emerald-50/40 border border-emerald-100/50 p-2.5 rounded-lg text-xs leading-relaxed">
                          {log.secondHalfReport ? log.secondHalfReport : <span className="text-slate-400 italic">Not submitted</span>}
                        </div>
                      </td>

                      {/* Total hours */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded-md text-xs">
                          {log.totalHours || '8'} hrs
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

export default WorkLogs;