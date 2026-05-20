// src/pages/admin/Attendance.js
import React, { useEffect, useState } from 'react';
import { getAllAttendance } from '../../services/api';
import { Card, CardHeader, CardBody, Badge, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const fetchAttendance = async (date) => {
    setLoading(true);
    try {
      const res = await getAllAttendance(date);
      setRecords(res.data.attendance);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(dateFilter); }, []);

  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;

  return (
    <div>
      <PageHeader title="Attendance Management" subtitle="View employee attendance records" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{records.length}</p>
          <p className="text-sm text-slate-500">Total Marked</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{present}</p>
          <p className="text-sm text-slate-500">Present</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{absent}</p>
          <p className="text-sm text-slate-500">Absent</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Attendance Records"
          action={
            <input type="date" value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); fetchAttendance(e.target.value); }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          }
        />
        <CardBody className="p-0">
          {loading ? <Spinner /> : records.length === 0 ? (
            <EmptyState icon={UserCheck} title="No records for selected date" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Employee', 'Employee ID', 'Date', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {r.employee?.firstName} {r.employee?.lastName}
                      </td>
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

export default AdminAttendance;
