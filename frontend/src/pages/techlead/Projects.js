// src/pages/techlead/Projects.js — MongoDB version
import React, { useEffect, useState } from 'react';
import { getAllProjects, createProject, getProjectApplications, updateApplicationStatus } from '../../services/api';
import { Card, CardBody, Badge, Button, Input, Textarea, Modal, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { Plus, FolderKanban, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [applications, setApplications] = useState({});
  const [form, setForm] = useState({ title: '', description: '', required_skills: '', duration: '' });

  const fetchProjects = async () => {
    try { const res = await getAllProjects(); setProjects(res.data.projects); }
    catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProject(form);
      toast.success('Project created! Employees notified via email.');
      setShowModal(false);
      setForm({ title: '', description: '', required_skills: '', duration: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setSubmitting(false); }
  };

  const toggleApplications = async (projectId) => {
    if (expandedProject === projectId) { setExpandedProject(null); return; }
    setExpandedProject(projectId);
    if (!applications[projectId]) {
      try {
        const res = await getProjectApplications(projectId);
        setApplications(prev => ({ ...prev, [projectId]: res.data.applications }));
      } catch { toast.error('Failed to load applications'); }
    }
  };

  const handleStatusChange = async (projectId, appId, status) => {
    try {
      await updateApplicationStatus(projectId, appId, status);
      toast.success(`Application ${status}`);
      const res = await getProjectApplications(projectId);
      setApplications(prev => ({ ...prev, [projectId]: res.data.applications }));
    } catch { toast.error('Failed to update status'); }
  };

  const myProjects = projects.filter(p => String(p.createdBy?._id || p.createdBy) === String(user.id));

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Project Management" subtitle={`${myProjects.length} projects created`}
        action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Create Project</Button>} />

      {myProjects.length === 0 ? (
        <Card><CardBody><EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project" /></CardBody></Card>
      ) : (
        <div className="space-y-4">
          {myProjects.map(project => (
            <Card key={project._id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800">{project.title}</h3>
                      <Badge status={project.isActive ? 'active' : 'rejected'} label={project.isActive ? 'Active' : 'Closed'} />
                    </div>
                    <p className="text-slate-500 text-sm mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>🛠 Skills: {project.requiredSkills || 'N/A'}</span>
                      <span>⏱ Duration: {project.duration || 'N/A'}</span>
                      <span>📅 {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleApplications(project._id)}>
                    Applicants {expandedProject === project._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                </div>

                {expandedProject === project._id && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <h4 className="font-semibold text-slate-700 mb-3">Applicants</h4>
                    {!applications[project._id] ? <p className="text-slate-400 text-sm">Loading...</p>
                    : applications[project._id].length === 0 ? <p className="text-slate-400 text-sm">No applications yet</p>
                    : (
                      <div className="space-y-2">
                        {applications[project._id].map(app => (
                          <div key={app._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-800 text-sm">
                                {app.employee?.firstName} {app.employee?.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{app.employee?.employeeId} · {app.employee?.status}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge status={app.status} />
                              {app.status === 'pending' && (
                                <>
                                  <button onClick={() => handleStatusChange(project._id, app._id, 'accepted')}
                                    className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600" title="Accept">
                                    <CheckCircle size={16} />
                                  </button>
                                  <button onClick={() => handleStatusChange(project._id, app._id, 'hold')}
                                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600" title="Hold">
                                    <Clock size={16} />
                                  </button>
                                  <button onClick={() => handleStatusChange(project._id, app._id, 'rejected')}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500" title="Reject">
                                    <XCircle size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Project Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <Textarea label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} required />
          <Input label="Required Skills (comma-separated)" value={form.required_skills}
            onChange={e => setForm({...form, required_skills: e.target.value})} placeholder="React, Node.js, MongoDB" />
          <Input label="Duration" value={form.duration}
            onChange={e => setForm({...form, duration: e.target.value})} placeholder="3 months" />
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            📧 All employees will be notified via email when this project is created.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
