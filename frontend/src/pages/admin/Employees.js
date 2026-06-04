// src/pages/admin/Employees.js — Integrated Version (Add, Edit, Delete, View + Filters)
import React, { useEffect, useState } from 'react';
import { getAllEmployees, addEmployee, updateEmployee, deleteEmployee } from '../../services/api';
import {
  Card, CardHeader, CardBody, Badge, Button, Input, Select, Modal, PageHeader, Spinner, EmptyState
} from '../../components/common/UI';
import { UserPlus, Pencil, Trash2, Users, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  first_name: '', last_name: '', dob: '', employee_id: '',
  official_email: '', contact_number: '', status: 'probation', role: 'employee',
};

// Dropdown
const DEPARTMENTS = ['Development', 'Design', 'QA / Testing', 'Management', 'HR'];

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const [viewEmployee, setViewEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res.data.employees);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const availableProjects = Array.from(
    new Set(
      employees
        .map(e => e.currentProject?.title)
        .filter(title => title && title !== '—')
    )
  );

  const openAddModal = () => {
    setEditEmployee(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditEmployee(emp);
    setForm({
      first_name: emp.firstName,
      last_name: emp.lastName,
      dob: emp.dob?.split('T')[0],
      contact_number: emp.contactNumber,
      status: emp.status,
      employee_id: emp.employeeId,
      official_email: emp.officialEmail,
      role: emp.user?.role || 'employee',
    });
    setShowModal(true);
  };

  const openViewModal = (emp) => {
    setViewEmployee(emp);
    setShowViewModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editEmployee) {
        await updateEmployee(editEmployee._id, form);
        toast.success('Employee updated');
      } else {
        await addEmployee(form);
        toast.success('Employee added successfully');
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteEmployee(id);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch { toast.error('Failed to delete employee'); }
  };

  //  filtered department and others
  const filtered = employees.filter(e => {
    const matchesSearch = `${e.firstName} ${e.lastName} ${e.employeeId} ${e.officialEmail}`
      .toLowerCase().includes(search.toLowerCase());
      
    const matchesDepartment = selectedDepartment 
      ? (e.department === selectedDepartment) 
      : true;

    const matchesProject = selectedProject 
      ? (e.currentProject?.title === selectedProject) 
      : true;

    return matchesSearch && matchesDepartment && matchesProject;
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Employee Management"
        subtitle={`${employees.length} total employees`}
        action={<Button onClick={openAddModal}><UserPlus size={16} /> Add Employee</Button>}
      />

      
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
      
        <div>
          <input 
            placeholder="Search employees..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700" 
          />
        </div>

        {/* department dropdown */}
        <div className="relative">
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 font-medium appearance-none"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* project dropdown */}
        <div className="relative">
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 font-medium appearance-none"
          >
            <option value="">All Projects</option>
            {availableProjects.map(projTitle => (
              <option key={projTitle} value={projTitle}>{projTitle}</option>
            ))}
          </select>
          <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* all employee car table */}
      <Card>
        <CardHeader
          title={`All Employees (${filtered.length})`}
        />
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No employees found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Name', 'Employee ID', 'Email', 'Contact', 'Status', 'Role', 'Project', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(emp => (
                    <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <span className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{emp.employeeId}</td>
                      <td className="px-4 py-3 text-slate-500">{emp.officialEmail}</td>
                      <td className="px-4 py-3 text-slate-500">{emp.contactNumber}</td>
                      <td className="px-4 py-3"><Badge status={emp.status} /></td>
                      <td className="px-4 py-3">
                        <Badge status={emp.user?.role === 'tech_lead' ? 'active' : 'hold'} label={emp.user?.role} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-semibold">{emp.currentProject?.title || '—'}</td>
                      
                    
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openViewModal(emp)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            title="View Profile">
                            <Eye size={15} />
                          </button>
                          
                          <button onClick={() => openEditModal(emp)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="Edit">
                            <Pencil size={15} />
                          </button>
                          
                          <button onClick={() => handleDelete(emp._id, `${emp.firstName} ${emp.lastName}`)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Add / Edit Employee Modal ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editEmployee ? 'Edit Employee' : 'Add New Employee'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={form.first_name}
            onChange={e => setForm({...form, first_name: e.target.value})} required />
          <Input label="Last Name" value={form.last_name}
            onChange={e => setForm({...form, last_name: e.target.value})} required />
          <Input label="Date of Birth" type="date" value={form.dob}
            onChange={e => setForm({...form, dob: e.target.value})} required />
          <Input label="Employee ID" value={form.employee_id}
            onChange={e => setForm({...form, employee_id: e.target.value})}
            required disabled={!!editEmployee} />
          <Input label="Official Email" type="email" value={form.official_email}
            onChange={e => setForm({...form, official_email: e.target.value})}
            required disabled={!!editEmployee} />
          <Input label="Contact Number" value={form.contact_number}
            onChange={e => setForm({...form, contact_number: e.target.value})} required />
          <Select label="Status" value={form.status}
            onChange={e => setForm({...form, status: e.target.value})}>
            <option value="probation">Probation</option>
            <option value="permanent">Permanent</option>
          </Select>
          
          {/* JSX tag </Select> */}
          <Select label="Role" value={form.role}
            onChange={e => setForm({...form, role: e.target.value})} disabled={!!editEmployee}>
            <option value="employee">Employee</option>
            <option value="tech_lead">Tech Lead</option>
          </Select>

          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editEmployee ? 'Update' : 'Add Employee'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Employee Profile Details Modal ── */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)}
        title="Employee Profile Details" size="md">
        {viewEmployee && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                {viewEmployee.firstName?.[0]}{viewEmployee.lastName?.[0]}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">{viewEmployee.firstName} {viewEmployee.lastName}</h4>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{viewEmployee.user?.role || 'employee'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                <span className="text-xs text-slate-400 block font-medium mb-0.5">Employee ID</span>
                <span className="font-semibold text-slate-700">{viewEmployee.employeeId}</span>
              </div>

              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                <span className="text-xs text-slate-400 block font-medium mb-0.5">Current Status</span>
                <div className="mt-0.5"><Badge status={viewEmployee.status} /></div>
              </div>

              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg col-span-2">
                <span className="text-xs text-slate-400 block font-medium mb-0.5">Official Email Address</span>
                <span className="font-semibold text-slate-700 break-all">{viewEmployee.officialEmail}</span>
              </div>

              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                <span className="text-xs text-slate-400 block font-medium mb-0.5">Contact Number</span>
                <span className="font-semibold text-slate-700">{viewEmployee.contactNumber || '—'}</span>
              </div>

              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                <span className="text-xs text-slate-400 block font-medium mb-0.5">Date of Birth</span>
                <span className="font-semibold text-slate-700">
                  {viewEmployee.dob ? new Date(viewEmployee.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>

              {/* Currently Working On Section */}
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg col-span-2">
                <span className="text-xs text-amber-600 block font-bold uppercase tracking-wider mb-1">Currently Working On</span>
                {viewEmployee.currentTask ? (
                  <div>
                    <span className="font-semibold text-slate-800 text-sm block">{viewEmployee.currentTask.title}</span>
                    {viewEmployee.currentTask.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{viewEmployee.currentTask.description}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-slate-500 italic">No active task at the moment (Idling)</span>
                )}
              </div>

              {/* Assigned Projects History */}
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg col-span-2">
                <span className="text-xs text-slate-400 block font-medium mb-1.5">Assigned Projects History</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewEmployee.assignedProjects && viewEmployee.assignedProjects.length > 0 ? (
                    viewEmployee.assignedProjects.map((proj, index) => (
                      <span 
                        key={proj._id || index} 
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                        title={proj.description || 'No description'}
                      >
                        {proj.title}
                      </span>
                    ))
                  ) : viewEmployee.currentProject?.title ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {viewEmployee.currentProject.title} (Current)
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500 italic">No projects assigned yet</span>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Employees;