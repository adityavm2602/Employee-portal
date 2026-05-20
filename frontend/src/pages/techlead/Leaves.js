// src/pages/techlead/Leaves.js — Step 1: TL reviews, then passes to HR
import React, { useEffect, useState } from 'react';
import { getTeamLeaves, tlLeaveReview } from '../../services/api';
import { Card, CardHeader, CardBody, Badge, Button, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TechLeadLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [comments, setComments] = useState({});
  const [acting, setActing] = useState(null);

  const fetchLeaves = async () => {
    try { const res = await getTeamLeaves(); setLeaves(res.data.leaves); }
    catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleReview = async (leaveId, status) => {
    setActing(leaveId + status);
    try {
      await tlLeaveReview(leaveId, status, comments[leaveId] || '');
      toast.success(status === 'approved'
        ? 'Leave approved! HR has been notified for final decision.'
        : 'Leave rejected. Employee has been notified.');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setActing(null); }
  };

  const filtered = leaves.filter(l => {
    if (filter === 'pending')  return l.techLeadStatus === 'pending';
    if (filter === 'approved') return l.techLeadStatus === 'approved';
    if (filter === 'rejected') return l.techLeadStatus === 'rejected';
    return true;
  });

  const getDays = (from, to) => Math.ceil((new Date(to)-new Date(from))/(1000*60*60*24)) + 1;

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="Step 1 of 2 — Your approval sends the request to HR" />

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-5 text-sm text-blue-800">
        📋 <strong>Your role:</strong> Approve or reject leave requests from your team.
        If you approve, the request goes to HR for final decision. Employee is notified at each step.
      </div>

      <div className="flex gap-2 mb-5">
        {['pending','approved','rejected','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f} ({leaves.filter(l =>
              f==='all' ? true : f==='pending' ? l.techLeadStatus==='pending' :
              f==='approved' ? l.techLeadStatus==='approved' : l.techLeadStatus==='rejected'
            ).length})
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave requests" />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(l => (
                <div key={l._id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {l.employee?.firstName?.[0]}{l.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {l.employee?.firstName} {l.employee?.lastName}
                            <span className="ml-2 text-xs text-slate-400 font-normal">{l.employee?.employeeId}</span>
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}
                            <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded-full text-xs">{getDays(l.fromDate,l.toDate)}d</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 ml-12 mt-1">{l.reason}</p>

                      {/* Status row */}
                      <div className="flex items-center gap-2 ml-12 mt-3">
                        <span className="text-xs text-slate-400">Your decision:</span>
                        <Badge status={l.techLeadStatus} />
                        {l.techLeadStatus === 'approved' && (
                          <>
                            <span className="text-xs text-slate-400">→ HR:</span>
                            <Badge
                              status={l.hrStatus === 'awaiting_tl' ? 'pending' : l.hrStatus}
                              label={l.hrStatus === 'awaiting_tl' ? 'waiting' : l.hrStatus}
                            />
                          </>
                        )}
                      </div>
                      {l.techLeadComment && (
                        <p className="text-xs text-slate-400 ml-12 mt-1">Your comment: <em>"{l.techLeadComment}"</em></p>
                      )}
                    </div>

                    {/* Action buttons only for pending */}
                    {l.techLeadStatus === 'pending' && (
                      <div className="flex flex-col gap-3 min-w-[200px]">
                        <textarea rows={2} placeholder="Optional comment..."
                          value={comments[l._id] || ''}
                          onChange={e => setComments(c => ({...c,[l._id]:e.target.value}))}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                        <div className="flex gap-2">
                          <Button size="sm" variant="success" className="flex-1"
                            loading={acting === l._id+'approved'}
                            onClick={() => handleReview(l._id, 'approved')}>
                            <CheckCircle size={13}/> Approve
                          </Button>
                          <Button size="sm" variant="danger" className="flex-1"
                            loading={acting === l._id+'rejected'}
                            onClick={() => handleReview(l._id, 'rejected')}>
                            <XCircle size={13}/> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TechLeadLeaves;
