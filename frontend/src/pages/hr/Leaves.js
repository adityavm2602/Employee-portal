// src/pages/hr/Leaves.js — HR final approval after Tech Lead approval
import React, { useEffect, useState } from 'react';
import { getHRLeaves, hrLeaveReview } from '../../services/api';
import { Card, CardHeader, CardBody, Badge, Button, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { CalendarDays, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const statusTabs = ['all', 'awaiting_hr', 'approved', 'rejected'];

const HRLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('awaiting_hr');
  const [comment, setComment] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [acting, setActing] = useState(null);

  const fetchLeaves = async () => {
    try { const res = await getHRLeaves(); setLeaves(res.data.leaves); }
    catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleReview = async (leaveId, status) => {
    setActing(leaveId + status);
    try {
      await hrLeaveReview(leaveId, status, comment[leaveId] || '');
      toast.success(`Leave ${status} successfully`);
      setComment(c => ({ ...c, [leaveId]: '' }));
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setActing(null); }
  };

  const filtered = leaves.filter(l => {
    if (tab === 'all') return true;
    if (tab === 'awaiting_hr') return l.status === 'tl_approved' && l.hrStatus === 'pending';
    if (tab === 'approved')    return l.status === 'approved';
    if (tab === 'rejected')    return l.status === 'rejected';
    return true;
  });

  const counts = {
    all:         leaves.length,
    awaiting_hr: leaves.filter(l => l.status === 'tl_approved' && l.hrStatus === 'pending').length,
    approved:    leaves.filter(l => l.status === 'approved').length,
    rejected:    leaves.filter(l => l.status === 'rejected').length,
  };

  const getDays = (from, to) => Math.ceil((new Date(to) - new Date(from)) / (1000*60*60*24)) + 1;

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Final HR approval after Tech Lead review" />

      {/* Tab bar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {statusTabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t === 'awaiting_hr' ? 'Awaiting HR' : t.charAt(0).toUpperCase() + t.slice(1)}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${tab === t ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave requests in this category" />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(l => (
                <div key={l._id} className="px-6 py-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">
                          {l.employee?.firstName?.[0]}{l.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {l.employee?.firstName} {l.employee?.lastName}
                            <span className="ml-2 text-xs text-slate-400 font-normal">{l.employee?.employeeId}</span>
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}
                            <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                              {getDays(l.fromDate, l.toDate)} day(s)
                            </span>
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 mt-3 ml-12">{l.reason}</p>

                      {/* 2-step status pills */}
                      <div className="flex items-center gap-2 mt-3 ml-12 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium">Step 1 — Tech Lead:</span>
                        <Badge
                          status={l.techLeadStatus}
                          label={l.techLeadStatus === 'approved' ? '✅ Approved' : l.techLeadStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                        />
                        {l.techLeadName && l.techLeadName !== 'N/A' && (
                          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                            TL: {l.techLeadName}
                          </span>
                        )}
                        <span className="text-slate-300">→</span>
                        <span className="text-xs text-slate-400 font-medium">Step 2 — HR:</span>
                        <Badge
                          status={l.hrStatus === 'awaiting_tl' ? 'pending' : l.hrStatus}
                          label={
                            l.hrStatus === 'awaiting_tl' ? '⏸ Waiting TL' :
                            l.hrStatus === 'pending' ? '⏳ Pending' :
                            l.hrStatus === 'approved' ? '✅ Approved' : '❌ Rejected'
                          }
                        />
                      </div>
                    </div>

                    {/* Actions - only if TL approved and HR hasn't acted */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {l.status === 'tl_approved' && l.hrStatus === 'pending' && (
                        <button onClick={() => setExpanded(expanded === l._id ? null : l._id)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Review {expanded === l._id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                      )}
                      {l.status !== 'tl_approved' && (
                        <Badge
                          status={l.status === 'approved' ? 'approved' : l.status === 'rejected' ? 'rejected' : 'pending'}
                          label={`Final: ${l.status}`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Expandable HR review panel */}
                  {expanded === l._id && l.status === 'tl_approved' && l.hrStatus === 'pending' && (
                    <div className="mt-4 ml-12 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-sm font-semibold text-slate-700 mb-3">HR Final Decision</p>
                      <textarea
                        rows={2}
                        placeholder="Optional comment (shown to employee in email)..."
                        value={comment[l._id] || ''}
                        onChange={e => setComment(c => ({...c, [l._id]: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="success"
                          size="sm"
                          loading={acting === l._id + 'approved'}
                          onClick={() => handleReview(l._id, 'approved')}
                        >
                          <CheckCircle size={14} /> Approve Leave
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={acting === l._id + 'rejected'}
                          onClick={() => handleReview(l._id, 'rejected')}
                        >
                          <XCircle size={14} /> Reject Leave
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TL Comment if any */}
                  {l.techLeadComment && (
                    <p className="text-xs text-slate-400 mt-2 ml-12">
                      TL Comment: <span className="text-slate-600 italic">"{l.techLeadComment}"</span>
                    </p>
                  )}
                  {l.hrComment && (
                    <p className="text-xs text-slate-400 mt-1 ml-12">
                      HR Comment: <span className="text-slate-600 italic">"{l.hrComment}"</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default HRLeaves;
