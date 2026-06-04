// src/pages/hr/Employees.js — HR views all employees (read-only)
import React, { useEffect, useState } from 'react';
import { getAllEmployees } from '../../services/api';
import { Card, CardHeader, CardBody, Badge, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try { const res = await getAllEmployees(); setEmployees(res.data.employees); }
      catch { toast.error('Failed to load employees'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeId} ${e.officialEmail} ${e.user?.role}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="All Employees" subtitle={`${employees.length} total accounts`} />
      <Card>
        <CardHeader title="Employee Directory"
          action={
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
          }
        />
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No employees found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Name','Employee ID','Email & Phone','Dept & Desig','Status','Role','Project'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(emp => (
                    <tr key={emp._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <span className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{emp.employeeId}</td>
                      <td className="px-4 py-3 text-slate-500">
                        <div>{emp.officialEmail}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{emp.contactNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <div className="font-medium text-slate-700">{emp.designation || '—'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{emp.department || '—'}</div>
                      </td>
                      <td className="px-4 py-3"><Badge status={emp.status} /></td>
                      <td className="px-4 py-3">
                        <Badge status={emp.user?.role === 'tech_lead' ? 'active' : emp.user?.role === 'hr' ? 'hold' : 'pending'}
                               label={emp.user?.role?.replace('_',' ')} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{emp.currentProject?.title || '—'}</td>
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

export default HREmployees;
