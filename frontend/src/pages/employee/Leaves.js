// // src/pages/employee/Leaves.js — Shows 2-step approval status
// import React, { useEffect, useState } from 'react';
// import { applyLeave, getMyLeaves } from '../../services/api';
// import { Card, CardHeader, CardBody, Badge, Button, Input, Textarea, Modal, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
// import { CalendarDays, Plus } from 'lucide-react';
// import toast from 'react-hot-toast';

// const statusLabel = {
//   pending:     { label: '⏳ Pending TL Review', color: 'bg-amber-100 text-amber-700' },
//   tl_approved: { label: '✅ TL Approved · Awaiting HR', color: 'bg-blue-100 text-blue-700' },
//   approved:    { label: '✅ Fully Approved',  color: 'bg-green-100 text-green-700' },
//   rejected:    { label: '❌ Rejected',         color: 'bg-red-100 text-red-600' },
// };

// const Leaves = () => {
//   const [leaves, setLeaves] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [filter, setFilter] = useState('all');
//   const [form, setForm] = useState({ from_date:'', to_date:'', reason:'' });

//   const fetchLeaves = async () => {
//     try { const res = await getMyLeaves(); setLeaves(res.data.leaves); }
//     catch { toast.error('Failed to load leaves'); }
//     finally { setLoading(false); }
//   };

//   useEffect(() => { fetchLeaves(); }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (new Date(form.from_date) > new Date(form.to_date))
//       return toast.error('From date cannot be after to date');
//     setSubmitting(true);
//     try {
//       await applyLeave(form);
//       toast.success('Leave submitted! Your Tech Lead and HR have been notified.');
//       setShowModal(false);
//       setForm({ from_date:'', to_date:'', reason:'' });
//       fetchLeaves();
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to submit');
//     } finally { setSubmitting(false); }
//   };

//   const getDays = (from, to) => Math.max(1, Math.ceil((new Date(to)-new Date(from))/(1000*60*60*24))+1);
//   const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

//   return (
//     <div>
//       <PageHeader
//         title="Leave Management"
//         subtitle="Leave goes through Tech Lead → HR approval"
//         action={<Button onClick={() => setShowModal(true)}><Plus size={16}/> Apply Leave</Button>}
//       />

//       {/* Approval process info */}
//       <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6 text-sm">
//         <div className="flex items-center gap-2">
//           <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
//           <span className="text-blue-800 font-medium">You Apply</span>
//         </div>
//         <span className="text-blue-400">→</span>
//         <div className="flex items-center gap-2">
//           <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
//           <span className="text-blue-800 font-medium">Tech Lead Reviews</span>
//         </div>
//         <span className="text-blue-400">→</span>
//         <div className="flex items-center gap-2">
//           <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
//           <span className="text-blue-800 font-medium">HR Final Approval</span>
//         </div>
//       </div>

//       {/* Filter tabs */}
//       <div className="flex gap-2 mb-5">
//         {['all','pending','tl_approved','approved','rejected'].map(f => (
//           <button key={f} onClick={() => setFilter(f)}
//             className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
//               ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
//             {f === 'tl_approved' ? 'TL Approved' : f.charAt(0).toUpperCase()+f.slice(1)}
//           </button>
//         ))}
//       </div>

//       <Card>
//         <CardBody className="p-0">
//           {loading ? <Spinner /> : filtered.length === 0 ? (
//             <EmptyState icon={CalendarDays} title="No leave requests" description="Apply for leave using the button above" />
//           ) : (
//             <div className="divide-y divide-slate-100">
//               {filtered.map(l => {
//                 const sl = statusLabel[l.status] || statusLabel.pending;
//                 return (
//                   <div key={l._id} className="px-6 py-5">
//                     <div className="flex items-start justify-between gap-4">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-3 mb-2">
//                           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sl.color}`}>{sl.label}</span>
//                           <span className="text-xs text-slate-400">
//                             {getDays(l.fromDate, l.toDate)} day(s)
//                           </span>
//                         </div>
//                         <p className="text-sm text-slate-700 font-medium">
//                           {new Date(l.fromDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
//                           {' → '}
//                           {new Date(l.toDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
//                         </p>
//                         <p className="text-sm text-slate-500 mt-1">{l.reason}</p>

//                         {/* 2-step tracker */}
//                         <div className="flex items-center gap-3 mt-3">
//                           <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
//                             ${l.techLeadStatus === 'approved' ? 'bg-green-100 text-green-700' :
//                               l.techLeadStatus === 'rejected' ? 'bg-red-100 text-red-600' :
//                               'bg-amber-100 text-amber-700'}`}>
//                             TL: {l.techLeadStatus}
//                           </div>
//                           <span className="text-slate-300 text-xs">→</span>
//                           <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
//                             ${l.hrStatus === 'approved' ? 'bg-green-100 text-green-700' :
//                               l.hrStatus === 'rejected' ? 'bg-red-100 text-red-600' :
//                               l.hrStatus === 'awaiting_tl' ? 'bg-slate-100 text-slate-500' :
//                               'bg-amber-100 text-amber-700'}`}>
//                             HR: {l.hrStatus === 'awaiting_tl' ? 'Waiting TL' : l.hrStatus}
//                           </div>
//                         </div>

//                         {/* Comments */}
//                         {l.techLeadComment && (
//                           <p className="text-xs text-slate-400 mt-2">TL: <em>"{l.techLeadComment}"</em></p>
//                         )}
//                         {l.hrComment && (
//                           <p className="text-xs text-slate-400 mt-1">HR: <em>"{l.hrComment}"</em></p>
//                         )}
//                       </div>
//                       <p className="text-xs text-slate-400 whitespace-nowrap">
//                         {new Date(l.createdAt).toLocaleDateString()}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </CardBody>
//       </Card>

//       <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <Input label="From Date" type="date" value={form.from_date}
//               onChange={e => setForm({...form, from_date: e.target.value})} required
//               min={new Date().toISOString().split('T')[0]} />
//             <Input label="To Date" type="date" value={form.to_date}
//               onChange={e => setForm({...form, to_date: e.target.value})} required
//               min={form.from_date || new Date().toISOString().split('T')[0]} />
//           </div>
//           {form.from_date && form.to_date && (
//             <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
//               📅 <strong>{getDays(form.from_date, form.to_date)} day(s)</strong> — Requires Tech Lead + HR approval
//             </div>
//           )}
//           <Textarea label="Reason for Leave" rows={4} placeholder="Please describe your reason..."
//             value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required />
//           <div className="flex justify-end gap-3">
//             <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
//             <Button type="submit" loading={submitting}>Submit Request</Button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default Leaves;


// src/pages/employee/Leaves.js
import React, { useEffect, useState } from 'react';
import { applyLeave, getMyLeaves } from '../../services/api';
import { Card, CardHeader, CardBody, Button, Input, Textarea, Modal, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { CalendarDays, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const statusLabel = {
  pending:     { label: '⏳ Pending TL Review', color: 'bg-amber-100 text-amber-700' },
  tl_approved: { label: '✅ TL Approved · Awaiting HR', color: 'bg-blue-100 text-blue-700' },
  approved:    { label: '✅ Fully Approved',  color: 'bg-green-100 text-green-700' },
  rejected:    { label: '❌ Rejected',         color: 'bg-red-100 text-red-600' },
};

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  
 
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '' });

  const fetchLeaves = async () => {
    try { 
      const res = await getMyLeaves(); 
      setLeaves(res.data.leaves || []); 
    } catch { 
      toast.error('Failed to load leaves'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.fromDate) > new Date(form.toDate))
      return toast.error('From date cannot be after to date');
    
    setSubmitting(true);
    try {
      await applyLeave(form);
      toast.success('Leave submitted! Your Tech Lead and HR have been notified.');
      setShowModal(false);
      setForm({ fromDate: '', toDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { 
      setSubmitting(false); 
    }
  };

  const getDays = (from, to) => Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1);
  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Leave goes through Tech Lead → HR approval"
        action={<Button onClick={() => setShowModal(true)}><Plus size={16}/> Apply Leave</Button>}
      />

      {/* Approval Process Step Info */}
      <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
          <span className="text-blue-800 font-medium">You Apply</span>
        </div>
        <span className="text-blue-400">→</span>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
          <span className="text-blue-800 font-medium">Tech Lead Reviews</span>
        </div>
        <span className="text-blue-400">→</span>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
          <span className="text-blue-800 font-medium">HR Final Approval</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all', 'pending', 'tl_approved', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f === 'tl_approved' ? 'TL Approved' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave requests" description="Apply for leave using the button above" />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(l => {
                const sl = statusLabel[l.status] || statusLabel.pending;
                return (
                  <div key={l._id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sl.color}`}>{sl.label}</span>
                          <span className="text-xs text-slate-400">
                            {getDays(l.fromDate, l.toDate)} day(s)
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">
                          {new Date(l.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' → '}
                          {new Date(l.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">{l.reason}</p>

                        {/* 2-step trackers */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className={`text-xs font-medium px-2.5 py-1 rounded-full
                            ${l.techLeadStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              l.techLeadStatus === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                            TL: {l.techLeadStatus || 'pending'}
                          </div>
                          <span className="text-slate-300 text-xs">→</span>
                          <div className={`text-xs font-medium px-2.5 py-1 rounded-full
                            ${l.hrStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              l.hrStatus === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                            HR: {l.hrStatus === 'awaiting_tl' ? 'Waiting TL' : (l.hrStatus || 'pending')}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleDateString()}
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
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" type="date" value={form.fromDate}
              onChange={e => setForm({ ...form, fromDate: e.target.value })} required
              min={new Date().toISOString().split('T')[0]} />
            <Input label="To Date" type="date" value={form.toDate}
              onChange={e => setForm({ ...form, toDate: e.target.value })} required
              min={form.fromDate || new Date().toISOString().split('T')[0]} />
          </div>
          {form.fromDate && form.toDate && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
              📅 <strong>{getDays(form.fromDate, form.toDate)} day(s)</strong> — Requires Tech Lead + HR approval
            </div>
          )}
          <Textarea label="Reason for Leave" rows={4} placeholder="Please describe your reason..."
            value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leaves;