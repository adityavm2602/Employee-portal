// src/pages/hr/Dashboard.js
import React, { useEffect, useState } from 'react';
import { getAllLeaves, getAllEmployees } from '../../services/api';
import { StatCard, Card, CardHeader, CardBody, Badge, Spinner, PageHeader } from '../../components/common/UI';
import { Users, CalendarDays, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const HRDashboard = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [l, e] = await Promise.all([getAllLeaves(), getAllEmployees()]);
        setLeaves(l.data.leaves);
        setEmployees(e.data.employees);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;

  const awaitingHR     = leaves.filter(l => l.status === 'tl_approved' && l.hrStatus === 'pending');
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected');

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.profile?.firstName || 'HR Manager'}`}
        subtitle={new Date().toDateString()}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Employees" value={employees.length}   icon={Users}        color="blue"   />
        <StatCard title="Awaiting HR"     value={awaitingHR.length}  icon={Clock}        color="amber"  />
        <StatCard title="Approved"        value={approvedLeaves.length} icon={CheckCircle} color="green" />
        <StatCard title="Total Requests"  value={leaves.length}      icon={CalendarDays} color="purple" />
      </div>

      {/* Leaves awaiting HR approval */}
      <Card className="mb-6">
        <CardHeader
          title="⏳ Awaiting Your Approval"
          subtitle="These leave requests have been approved by Tech Lead — your final decision is needed"
        />
        <CardBody className="p-0">
          {awaitingHR.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No leaves awaiting your approval 🎉</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {awaitingHR.slice(0, 8).map(l => (
                <div key={l._id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {l.employee?.firstName} {l.employee?.lastName}
                      <span className="ml-2 text-xs text-slate-400 font-normal">{l.employee?.employeeId}</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-md">{l.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge status="tl_approved" label="TL ✅ Approved" />
                    <Badge status="pending" label="HR Pending" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent leave activity */}
      <Card>
        <CardHeader title="Recent Leave Activity" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Employee','Period','TL Status','HR Status','Final'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.slice(0, 10).map(l => (
                  <tr key={l._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{l.employee?.firstName} {l.employee?.lastName}</p>
                      <p className="text-xs text-slate-400">{l.employee?.employeeId}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(l.fromDate).toLocaleDateString()}<br/>→ {new Date(l.toDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3"><Badge status={l.techLeadStatus} /></td>
                    <td className="px-4 py-3">
                      <Badge status={l.hrStatus === 'awaiting_tl' ? 'pending' : l.hrStatus}
                             label={l.hrStatus === 'awaiting_tl' ? 'Waiting TL' : l.hrStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={l.status === 'tl_approved' ? 'pending' : l.status}
                             label={l.status === 'tl_approved' ? 'TL Approved' : l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default HRDashboard;
