// src/pages/techlead/MyLeaves.js — Tech Lead applies for their own leave (skips TL step → HR only)
import React, { useEffect, useState } from 'react';
import { applyLeave, getMyLeaves } from '../../services/api';
import { Card, CardHeader, CardBody, Button, Input, Textarea, Modal, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { CalendarDays, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const statusMeta = {
  pending:     { label: '⏳ Pending',             cls: 'bg-amber-100 text-amber-700' },
  tl_approved: { label: '📨 Sent to HR',          cls: 'bg-blue-100 text-blue-700'  },
  approved:    { label: '✅ Approved by HR',       cls: 'bg-green-100 text-green-700'},
  rejected:    { label: '❌ Rejected',             cls: 'bg-red-100 text-red-600'    },
};

const MyLeaves = () => {
  const [leaves, setLeaves]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]     = useState('all');
  const [form, setForm]         = useState({ from_date: '', to_date: '', reason: '' });

  const fetchLeaves = async () => {
    try { const res = await getMyLeaves(); setLeaves(res.data.leaves); }
    catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.from_date) > new Date(form.to_date))
      return toast.error('From date cannot be after to date');
    setSubmitting(true);
    try {
      await applyLeave(form);
      toast.success('Leave submitted! HR has been notified for approval.');
      setShowModal(false);
      setForm({ from_date: '', to_date: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const getDays = (from, to) => Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1);

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  const counts = {
    all:         leaves.length,
    tl_approved: leaves.filter(l => l.status === 'tl_approved').length,
    approved:    leaves.filter(l => l.status === 'approved').length,
    rejected:    leaves.filter(l => l.status === 'rejected').length,
  };

  return (
    <div>
      <PageHeader
        title="My Leave Requests"
        subtitle="As Tech Lead, your leave goes directly to HR for approval"
        action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Apply Leave</Button>}
      />

      {/* Info banner */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
        <div className="text-2xl">ℹ️</div>
        <div>
          <p className="font-semibold text-blue-800 text-sm">Your leave approval flow</p>
          <p className="text-blue-700 text-xs mt-0.5">
            Since you are a Tech Lead, your leave requests skip the TL review step and go <strong>directly to HR</strong> for approval.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'all',         label: 'Total',       color: 'bg-slate-50  border-slate-200  text-slate-700'  },
          { key: 'tl_approved', label: 'Awaiting HR', color: 'bg-blue-50   border-blue-200   text-blue-700'   },
          { key: 'approved',    label: 'Approved',    color: 'bg-green-50  border-green-200  text-green-700'  },
          { key: 'rejected',    label: 'Rejected',    color: 'bg-red-50    border-red-200    text-red-600'    },
        ].map(({ key, label, color }) => (
          <div key={key} onClick={() => setFilter(key)}
            className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-all hover:shadow-sm
              ${filter === key ? 'ring-2 ring-blue-400 ' + color : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <p className="text-2xl font-bold text-slate-800">{counts[key]}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave requests" description="Apply for leave using the button above" />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(l => {
                const meta = statusMeta[l.status] || statusMeta.pending;
                return (
                  <div key={l._id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Status + duration */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {getDays(l.fromDate, l.toDate)} day(s)
                          </span>
                        </div>

                        {/* Dates */}
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(l.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' → '}
                          {new Date(l.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>

                        {/* Reason */}
                        <p className="text-sm text-slate-500 mt-1">{l.reason}</p>

                        {/* Step tracker */}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            ✅ TL: Auto-approved (You)
                          </div>
                          <span className="text-slate-300 text-xs">→</span>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                            ${l.hrStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              l.hrStatus === 'rejected' ? 'bg-red-100 text-red-600' :
                              'bg-amber-100 text-amber-700'}`}>
                            HR: {l.hrStatus === 'pending' ? 'Pending' : l.hrStatus === 'approved' ? 'Approved' : 'Rejected'}
                          </div>
                        </div>

                        {/* HR comment */}
                        {l.hrComment && (
                          <p className="text-xs text-slate-400 mt-2 italic">
                            HR comment: "{l.hrComment}"
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 whitespace-nowrap">
                        Applied: {new Date(l.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Apply Leave Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
            ℹ️ Your leave will be sent directly to <strong>HR</strong> for approval (TL step is auto-approved).
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" type="date" value={form.from_date}
              onChange={e => setForm({ ...form, from_date: e.target.value })} required
              min={new Date().toISOString().split('T')[0]} />
            <Input label="To Date" type="date" value={form.to_date}
              onChange={e => setForm({ ...form, to_date: e.target.value })} required
              min={form.from_date || new Date().toISOString().split('T')[0]} />
          </div>
          {form.from_date && form.to_date && new Date(form.from_date) <= new Date(form.to_date) && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
              📅 <strong>{getDays(form.from_date, form.to_date)} day(s)</strong>
            </div>
          )}
          <Textarea label="Reason for Leave" rows={4}
            placeholder="Please provide a reason for your leave request..."
            value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit to HR</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyLeaves;
