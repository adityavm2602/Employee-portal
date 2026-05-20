// src/pages/techlead/Attendance.js
import React, { useEffect, useState } from 'react';
import { getTeamAttendance } from '../../services/api';
import { Card, CardBody, Badge, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const TechLeadAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await getTeamAttendance(); setRecords(res.data.attendance); }
      catch { toast.error('Failed to load attendance'); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Team Attendance" subtitle="Track your team's daily attendance" />
      <Card>
        <CardBody className="p-0">
          {loading ? <Spinner /> : records.length === 0 ? (
            <EmptyState icon={UserCheck} title="No attendance records found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Employee', 'ID', 'Date', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-4 py-3 text-slate-500">{r.employee?.employeeId}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(r.attDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Badge status={r.status} /></td>
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

export default TechLeadAttendance;
