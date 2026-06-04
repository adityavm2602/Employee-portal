// src/pages/admin/Leaves.js — Admin sees full 2-step status
import React, { useEffect, useState } from 'react';
import { getAllLeaves } from '../../services/api';
import { Card, CardHeader, CardBody, Badge, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLeaves() {
  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    (async () => {
      try { const res = await getAllLeaves(); setLeaves(res.data.leaves); }
      catch { toast.error('Failed to load leaves'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter || l.status === filter);

  const getDays = (f,t) => Math.ceil((new Date(t)-new Date(f))/(1000*60*60*24))+1;

  return (
    <div>
      <PageHeader title="All Leave Requests" subtitle="Full 2-step approval view" />

      <div className="flex gap-2 mb-5 flex-wrap">
        {['all','pending','tl_approved','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter===f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f==='tl_approved' ? 'TL Approved' : f==='all' ? `All (${leaves.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${leaves.filter(l=>l.status===f).length})`}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No records" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Employee','Period','Days','Reason','TL Status','HR Status','Final'].map(h => (
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
                        <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                          {l.techLeadName && l.techLeadName !== 'N/A' && (
                            <div>TL: {l.techLeadName}</div>
                          )}
                          {l.hrReviewedByName && (
                            <div>HR: {l.hrReviewedByName}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(l.fromDate).toLocaleDateString()}<br/>→ {new Date(l.toDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          {getDays(l.fromDate,l.toDate)}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate text-xs">{l.reason}</td>
                      <td className="px-4 py-3"><Badge status={l.techLeadStatus} /></td>
                      <td className="px-4 py-3">
                        <Badge
                          status={l.hrStatus==='awaiting_tl' ? 'pending' : l.hrStatus}
                          label={l.hrStatus==='awaiting_tl' ? 'Waiting TL' : l.hrStatus}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          status={l.status==='tl_approved' ? 'pending' : l.status}
                          label={l.status==='tl_approved' ? 'TL Approved' : l.status}
                        />
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
}
