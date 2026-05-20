// src/pages/employee/Applications.js
import React, { useEffect, useState } from 'react';
import { getMyApplications } from '../../services/api';
import { Card, CardHeader, CardBody, Badge, PageHeader, Spinner, EmptyState } from '../../components/common/UI';
import { CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const Applications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try { const res = await getMyApplications(); setApps(res.data.applications); }
      catch { toast.error('Failed to load applications'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);
  const counts = {
    pending: apps.filter(a => a.status === 'pending').length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    hold: apps.filter(a => a.status === 'hold').length,
  };

  return (
    <div>
      <PageHeader title="My Applications" subtitle="Track your project application statuses" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[['pending','Pending','amber'],['accepted','Accepted','green'],['hold','On Hold','blue'],['rejected','Rejected','red']].map(([key, label, color]) => (
          <div key={key} onClick={() => setFilter(key === filter ? 'all' : key)}
            className="cursor-pointer p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-center transition-all">
            <p className="text-2xl font-bold text-slate-800">{counts[key]}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title={`${filtered.length} Applications`} />
        <CardBody className="p-0">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No applications found" description="Apply to projects from the Projects page" />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(app => (
                <div key={app._id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{app.project?.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{app.project?.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-slate-400">
                        {app.project?.requiredSkills && <span>🛠 {app.project.requiredSkills}</span>}
                        {app.project?.duration && <span>⏱ {app.project.duration}</span>}
                        <span>📅 Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge status={app.status} />
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

export default Applications;
