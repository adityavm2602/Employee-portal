// src/pages/admin/Leaves.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardBody, Badge, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { CalendarDays, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(res.data.leaves || []);
    } catch { 
      toast.error('Failed to load leaves'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (id, decision) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/admin/leaves/${id}`, 
        { status: decision },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Leave request ${decision} successful!`);
        fetchLeaves(); // refresh state
      }
    } catch {
      toast.error('Failed to update leave request');
    }
  };

  

// १. Filter logic
const filtered = filter === 'all' 
  ? leaves 
  : leaves.filter(l => {
      if (filter === 'pending') return l.status === 'pending' || l.hrStatus === 'pending';
      return l.status === filter;
    });

const getDays = (f, t) => Math.max(1, Math.ceil((new Date(t) - new Date(f)) / (1000 * 60 * 60 * 24)) + 1);

return (
  <div>
    <PageHeader title="All Leave Requests" subtitle="Full 2-step approval view & management" />

    {/* २. Counters */}
    <div className="flex gap-2 mb-5 flex-wrap">
      <button onClick={() => setFilter('all')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        All ({leaves.length})
      </button>
      
      <button onClick={() => setFilter('pending')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        Pending ({leaves.filter(l => l.status === 'pending' || l.hrStatus === 'pending').length})
      </button>

      <button onClick={() => setFilter('tl_approved')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'tl_approved' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        TL Approved ({leaves.filter(l => l.status === 'tl_approved').length})
      </button>

      <button onClick={() => setFilter('approved')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        Approved ({leaves.filter(l => l.status === 'approved').length})
      </button>

      <button onClick={() => setFilter('rejected')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        Rejected ({leaves.filter(l => l.status === 'rejected').length})
      </button>
    </div>


      <Card>
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No records found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Employee', 'Period', 'Days', 'Reason', 'TL Status', 'HR Status', 'Final Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(l => (
                    <tr key={l._id} className="hover:bg-slate-50 transition-colors">
                      {/* Employee Info */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{l.employee?.firstName || 'Unknown'} {l.employee?.lastName || ''}</p>
                        <p className="text-xs text-slate-400">{l.employee?.employeeId || '—'}</p>
                      </td>
                      
                      {/* Leave Period */}
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {l.fromDate ? new Date(l.fromDate).toLocaleDateString('en-IN') : '—'}<br/>
                        → {l.toDate ? new Date(l.toDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      
                      {/* Total Days */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          {getDays(l.fromDate, l.toDate)}d
                        </span>
                      </td>
                      
                      {/* Leave Reason */}
                      <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate text-xs">{l.reason || '—'}</td>
                      
                      {/* Tech Lead Approvals Status */}
                      <td className="px-4 py-3"><Badge status={l.techLeadStatus || 'pending'} /></td>
                      
                      {/* HR Approvals Status */}
                      <td className="px-4 py-3">
                        <Badge
                          status={l.hrStatus === 'awaiting_tl' ? 'pending' : (l.hrStatus || 'pending')}
                          label={l.hrStatus === 'awaiting_tl' ? 'Waiting TL' : (l.hrStatus || 'pending')}
                        />
                      </td>
                      
                      {/* Final Status */}
                      <td className="px-4 py-3">
                        <Badge
                          status={l.status === 'tl_approved' ? 'pending' : l.status}
                          label={l.status === 'tl_approved' ? 'TL Approved' : l.status}
                        />
                      </td>

                      {/* Actions Buttons */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {l.status === 'pending' || l.status === 'tl_approved' ? (
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleAction(l._id, 'approved')}
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleAction(l._id, 'rejected')}
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium">Processed</span>
                        )}
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