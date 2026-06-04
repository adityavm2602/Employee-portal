// src/pages/admin/Dashboard.js - Final Version with all 6 Checklist Items
import React, { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  CalendarX,
  Briefcase,
  Clock,
  UserMinus,
  PieChart,
  Activity,
} from "lucide-react";
import {
  getDashboard,
  getAllLeaves,
  getAllProjects,
  getAllEmployees,
} from "../../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    present: 0,
    absent: 0,
    activeProjects: 0,
    pendingLeaves: 0,
    employeesOnLeave: 0, // १. Employees on Leave
  });
  
  const [projectAllocation, setProjectAllocation] = useState([]); // २. Project-wise Allocation

  const loadData = async () => {
    try {
      const dashboard = await getDashboard();
      const leaves = await getAllLeaves();
      const projectsRes = await getAllProjects();
      const employeesRes = await getAllEmployees();

      // Pending Leave Requests
      const pendingLeaves =
        leaves?.data?.leaves?.filter(
          (x) => x.status === "pending" || x.status === "tl_approved"
        ).length || 0;

      // Employees on Leave
      const todayStr = new Date().toISOString().split('T')[0];
      const onLeaveCount = leaves?.data?.leaves?.filter(
        (x) => x.status === "approved" && todayStr >= x.startDate?.split('T')[0] && todayStr <= x.endDate?.split('T')[0]
      ).length || 0;

      // Project-wise Employee Allocation
      const emps = employeesRes?.data?.employees || [];
      const projs = projectsRes?.data?.projects || [];
      
      const allocation = projs.map(p => {
        const count = emps.filter(e => e.currentProject?._id === p._id || e.currentProject === p._id).length;
        return { title: p.title, count };
      });

      setProjectAllocation(allocation);

      setStats({
        totalEmployees: dashboard?.data?.dashboard?.totalEmployees || emps.length || 0,
        present: dashboard?.data?.dashboard?.attendance?.present || 0,
        absent: dashboard?.data?.dashboard?.attendance?.absent || 0,
        activeProjects: projs.length || 0,
        pendingLeaves,
        employeesOnLeave: onLeaveCount,
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  const cards = [
    { title: "Total Employees", value: stats.totalEmployees, icon: Users, color: "text-blue-600 bg-blue-50" },
    { title: "Present Today", value: stats.present, icon: CalendarCheck, color: "text-emerald-600 bg-emerald-50" },
    { title: "Employees on Leave", value: stats.employeesOnLeave, icon: UserMinus, color: "text-purple-600 bg-purple-50" },
    { title: "Active Projects", value: stats.activeProjects, icon: Briefcase, color: "text-indigo-600 bg-indigo-50" },
    { title: "Pending Leaves", value: stats.pendingLeaves, icon: Clock, color: "text-orange-500 bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Workforce Management & Core Analytics</p>
      </div>

      {/* ५ Total, Present, On Leave, Active Proj, Pending Leaves */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{card.title}</p>
                  <h2 className="text-3xl font-black mt-2 text-slate-800">{card.value}</h2>
                </div>
                <Icon className={`w-10 h-10 p-2 rounded-lg ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ३. Daily Work Status Summary  */}
        <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-800">Daily Work Status Summary</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
              <h3 className="font-medium text-slate-600 text-sm">Present Today</h3>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.present}</p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
              <h3 className="font-medium text-slate-600 text-sm">Absent / Idling</h3>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.absent}</p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
              <h3 className="font-medium text-slate-600 text-sm">Pending Requests</h3>
              <p className="text-3xl font-bold text-orange-500 mt-1">{stats.pendingLeaves}</p>
            </div>
          </div>
        </div>

        {/* ४. Project-wise Employee Allocation  */}
        <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">Project Allocation</h2>
          </div>
          <div className="mt-4 space-y-3 max-h-[160px] overflow-y-auto pr-1">
            {projectAllocation.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-2">No projects or allocations found.</p>
            ) : (
              projectAllocation.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm">
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">{item.title}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {item.count} Emps
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}