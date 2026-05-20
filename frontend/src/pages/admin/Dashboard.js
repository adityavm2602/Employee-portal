// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { getDashboard, sendBirthdayWish } from '../../services/api';
import { StatCard, Card, CardHeader, CardBody, Spinner, PageHeader } from '../../components/common/UI';
import { Users, FolderKanban, UserCheck, UserX, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getDashboard();
        setData(res.data.dashboard);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle={`Today: ${new Date().toDateString()}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Employees" value={data?.totalEmployees} icon={Users} color="blue" />
        <StatCard title="Active Projects" value={data?.activeProjects} icon={FolderKanban} color="purple" />
        <StatCard title="Present Today" value={data?.attendance?.present} icon={UserCheck} color="green" />
        <StatCard title="Absent Today" value={data?.attendance?.absent} icon={UserX} color="red" />
      </div>

      <Card>
        <CardHeader title="🎂 Today's Birthdays" subtitle="Employees celebrating their birthday today" />
        <CardBody>
          {data?.todayBirthdays?.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No birthdays today 🎉</p>
          ) : (
            <div className="space-y-3">
              {data?.todayBirthdays?.map((emp) => (
                <div key={emp._id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-sm">
                    {emp.firstName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</p>
                    <p className="text-sm text-slate-500">{emp.employeeId}</p>
                  </div>
                  <Gift className="ml-auto text-amber-500" size={20} />
                  <button
                    onClick={async () => {
                      try {
                        setSendingId(emp._id);
                        await sendBirthdayWish(emp._id);
                        toast.success('Birthday emails sent.');
                      } catch (err) {
                        toast.error('Failed to send birthday emails.');
                      } finally { setSendingId(null); }
                    }}
                    disabled={sendingId === emp._id}
                    className={`ml-3 inline-flex items-center gap-2 text-white text-sm px-3 py-1 rounded ${sendingId===emp._id ? 'bg-amber-300' : 'bg-amber-500 hover:bg-amber-600'}`}
                  >
                    {sendingId===emp._id ? 'Sending…' : 'Send Wishes'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminDashboard;
