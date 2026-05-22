// src/pages/admin/Employees.js — MongoDB version (camelCase fields, _id)
import React, { useEffect, useState } from 'react';
import { getAllEmployees, addEmployee, updateEmployee, deleteEmployee } from '../../services/api';
import {
  Card, CardHeader, CardBody, Badge, Button, Input, Select, Modal, PageHeader, Spinner, EmptyState
} from '../../components/common/UI';
import { UserPlus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  first_name: '', last_name: '', dob: '', employee_id: '',
  official_email: '', contact_number: '', status: 'probation', role: 'employee',
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [project, setProject] = useState('all');

  const fetchEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res.data.employees);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, []);

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


  // Get unique departments and projects for filters
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  const projects = Array.from(new Set(employees.map(e => e.currentProject?.title).filter(Boolean)));

  let filtered = employees;
  if (department !== 'all') filtered = filtered.filter(e => e.department === department);
  if (project !== 'all') filtered = filtered.filter(e => e.currentProject?.title === project);
  filtered = filtered.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeId} ${e.officialEmail}`
      .toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Employee Management"
        subtitle={`${employees.length} total employees`}
        action={<Button onClick={openAddModal}><UserPlus size={16} /> Add Employee</Button>}
      />

      <Card>
        <CardHeader
          title="All Employees"
          action={
            <div className="flex gap-2 items-center">
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded-lg text-sm">
                <option value="all">All Departments</option>
                {departments.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
              <select value={project} onChange={e => setProject(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded-lg text-sm">
                <option value="all">All Projects</option>
                {projects.map(proj => (
                  <option key={proj} value={proj}>{proj}</option>
                ))}
              </select>
              <input placeholder="Search employees..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60" />
            </div>
          }
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
                      <td className="px-4 py-3 text-slate-500">{emp.currentProject?.title || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(emp)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(emp._id, `${emp.firstName} ${emp.lastName}`)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
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
    </div>
  );
};

export default Employees;
