// src/pages/employee/Projects.js
import React, { useEffect, useState } from 'react';
import { getAllProjects, applyForProject, getMyApplications } from '../../services/api';
import { Card, CardBody, Badge, Button, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { Briefcase, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeProjects = () => {
  const [projects, setProjects] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([getAllProjects(), getMyApplications()]);
        setProjects(p.data.projects.filter(pr => pr.isActive));
        setMyApps(a.data.applications);
      } catch { toast.error('Failed to load projects'); }
      finally { setLoading(false); }
    })();
  }, []);

  const getAppStatus = (projectId) => {
    const app = myApps.find(a => String(a.project?._id || a.project) === String(projectId));
    return app ? app.status : null;
  };

  const handleApply = async (projectId) => {
    setApplying(projectId);
    try {
      await applyForProject(projectId);
      toast.success('Application submitted!');
      const res = await getMyApplications();
      setMyApps(res.data.applications);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally { setApplying(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Available Projects" subtitle={`${projects.length} active projects`} />
      {projects.length === 0 ? (
        <Card><CardBody><EmptyState icon={Briefcase} title="No projects available" /></CardBody></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map(project => {
            const status = getAppStatus(project._id);
            return (
              <Card key={project._id}>
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">{project.title}</h3>
                    {status && <Badge status={status} />}
                  </div>
                  <p className="text-slate-500 text-sm mb-4 leading-relaxed">{project.description}</p>
                  <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                    {project.requiredSkills && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="font-medium text-slate-600 mr-1">Skills:</span>
                        {project.requiredSkills.split(',').map(s => (
                          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">{s.trim()}</span>
                        ))}
                      </div>
                    )}
                    {project.duration && <p>⏱ Duration: <span className="text-slate-700">{project.duration}</span></p>}
                    <p>📅 Posted: {new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                  {!status ? (
                    <Button size="sm" loading={applying === project._id} onClick={() => handleApply(project._id)} className="w-full">
                      <Send size={14} /> Apply Now
                    </Button>
                  ) : (
                    <div className={`text-center py-2 rounded-lg text-sm font-medium
                      ${status === 'accepted' ? 'bg-green-50 text-green-700' :
                        status === 'rejected' ? 'bg-red-50 text-red-600' :
                        status === 'hold' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                      {status === 'pending' ? '⏳ Application Pending' :
                       status === 'accepted' ? '✅ Application Accepted' :
                       status === 'rejected' ? '❌ Application Rejected' : '🔵 Application On Hold'}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeProjects;
