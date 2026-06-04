// src/pages/employee/Attendance.js — Mark and view own attendance
import React, { useEffect, useState } from 'react';
import { markAttendance, getMyAttendance } from '../../services/api';
import { Card, CardHeader, CardBody, Badge, Button, PageHeader, Spinner } from '../../components/common/UI';
import { UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(r => r.attDate?.split('T')[0] === today);

  const fetchAttendance = async () => {
    try {
      const res = await getMyAttendance();
      setRecords(res.data.attendance);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(); }, []);

  const handleMark = async (status) => {
    setMarking(true);
    try {
      await markAttendance(status);
      toast.success(`Marked as ${status}`);
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally { setMarking(false); }
  };

  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Mark and track your daily attendance" />

      {/* Mark today */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Today's Attendance</h3>
              <p className="text-sm text-slate-500">{new Date().toDateString()}</p>
              {todayRecord && (
                <div className="mt-2">
                  <Badge status={todayRecord.status} label={`Already marked: ${todayRecord.status}`} />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="success"
                loading={marking}
                onClick={() => handleMark('present')}
              >
                <UserCheck size={16} /> Present
              </Button>
              <Button
                variant="danger"
                loading={marking}
                onClick={() => handleMark('absent')}
              >
                <UserX size={16} /> Absent
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{records.length}</p>
          <p className="text-sm text-slate-500">Total Days</p>
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

      {/* History */}
      <Card>
        <CardHeader title="Attendance History" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Date', 'Day', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(r => {
                  const d = new Date(r.attDate);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-slate-500">{d.toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                      <td className="px-4 py-3"><Badge status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Attendance;
