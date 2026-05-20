// src/pages/employee/WorkLogs.js
import React, { useEffect, useState } from 'react';
import { createWorkLog, getMyWorkLogs, getAllProjects } from '../../services/api';
import { Card, CardBody, Button, Input, Select, Textarea, Modal, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { ClipboardList, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkLogs = () => {
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ project_id: '', description: '', hours: '', log_date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      const [l, p] = await Promise.all([getMyWorkLogs(), getAllProjects()]);
      setLogs(l.data.logs);
      setProjects(p.data.projects.filter(pr => pr.isActive));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createWorkLog(form);
      toast.success('Work log submitted!');
      setShowModal(false);
      setForm({ project_id: '', description: '', hours: '', log_date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const totalHours = logs.reduce((sum, l) => sum + parseFloat(l.hours || 0), 0);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Work Logs"
        subtitle={`${logs.length} entries · ${totalHours.toFixed(1)} total hours`}
        action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Log Work</Button>}
      />

      <Card>
        <CardBody className="p-0">
          {logs.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No work logs yet" description="Start logging your daily tasks" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Date', 'Project', 'Hours', 'Task Description'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(l => (
                    <tr key={l._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(l.logDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{l.project?.title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{l.hours}h</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">{l.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Today's Work">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Project" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} required>
            <option value="">Select project...</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </Select>
          <Input label="Date" type="date" value={form.log_date}
            onChange={e => setForm({...form, log_date: e.target.value})} required max={new Date().toISOString().split('T')[0]} />
          <Input label="Hours Spent" type="number" step="0.5" min="0.5" max="24"
            placeholder="e.g. 3.5" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} required />
          <Textarea label="Task Description" rows={4} placeholder="Describe what you worked on..."
            value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkLogs;
