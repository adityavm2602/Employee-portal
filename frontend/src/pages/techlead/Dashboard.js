import React, { useEffect, useState } from "react";

import {
  getAllProjects,
  getMyTeam,
  getTeamLeaves,
} from "../../services/api";

import {
  getEmployeeUpdates,
} from "../../services/techLeadService";

import {
  StatCard,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Spinner,
  PageHeader,
} from "../../components/common/UI";

import {
  FolderKanban,
  Users,
  CalendarDays,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import toast from "react-hot-toast";

const TechLeadDashboard = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [p, t, l, u] = await Promise.all([
        getAllProjects(),
        getMyTeam(),
        getTeamLeaves(),
        getEmployeeUpdates(),
      ]);

      setProjects(p.data.projects || []);
      setTeam(t.data.team || []);

      setLeaves(
        (l.data.leaves || []).filter(
          (leave) => leave.status === "pending"
        )
      );

      setUpdates(u.data || []);

    } catch (error) {
      console.log(error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  const myProjects = projects.filter(
    (project) =>
      project.createdBy === user.id ||
      project.createdBy?._id === user.id ||
      String(project.createdBy) === user.id
  );

  const totalUpdates = updates.reduce(
    (acc, emp) =>
      acc + (emp.dailyUpdates?.length || 0),
    0
  );

  return (
    <div>

      <PageHeader
        title={`Welcome, ${
          user?.profile?.firstName ||
          user?.name ||
          "Tech Lead"
        }`}
        subtitle={new Date().toDateString()}
      />

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        <StatCard
          title="My Projects"
          value={myProjects.length}
          icon={FolderKanban}
          color="blue"
        />

        <StatCard
          title="Team Members"
          value={team.length}
          icon={Users}
          color="green"
        />

        <StatCard
          title="Pending Leaves"
          value={leaves.length}
          icon={CalendarDays}
          color="amber"
        />

        <StatCard
          title="Daily Updates"
          value={totalUpdates}
          icon={ClipboardList}
          color="purple"
        />

      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PROJECTS */}

        <Card>
          <CardHeader title="My Projects" />

          <CardBody className="p-0">

            {myProjects.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">
                No projects assigned
              </p>
            ) : (
              <div className="divide-y divide-slate-100">

                {myProjects.map((project) => (
                  <div
                    key={project._id}
                    className="px-6 py-4"
                  >
                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-medium text-slate-800">
                          {project.title}
                        </p>

                        <p className="text-sm text-slate-500">
                          {project.duration}
                        </p>

                      </div>

                      <Badge
                        status={
                          project.isActive
                            ? "active"
                            : "rejected"
                        }
                        label={
                          project.isActive
                            ? "Active"
                            : "Closed"
                        }
                      />

                    </div>

                    <div className="mt-3">

                      <div className="w-full bg-slate-200 rounded-full h-2">

                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              project.progress || 0
                            }%`,
                          }}
                        />

                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Progress: {project.progress || 0}%
                      </p>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </CardBody>
        </Card>

        {/* TEAM MEMBERS */}

        <Card>
          <CardHeader title="Team Members" />

          <CardBody className="p-0">

            {team.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">
                No team members assigned
              </p>
            ) : (
              <div className="divide-y divide-slate-100">

                {team.map((member) => (
                  <div
                    key={member._id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>

                      <p className="font-medium text-slate-800">
                        {member.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {member.email}
                      </p>

                    </div>

                    <Badge
                      status="active"
                      label={
                        member.designation ||
                        "Employee"
                      }
                    />

                  </div>
                ))}

              </div>
            )}

          </CardBody>
        </Card>

        {/* DAILY UPDATES */}

        <Card className="lg:col-span-2">
          <CardHeader title="Employee Daily Updates" />

          <CardBody className="p-0">

            {updates.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">
                No daily updates found
              </p>
            ) : (
              <div className="divide-y divide-slate-100">

                {updates.map((employee) =>
                  employee.dailyUpdates?.map(
                    (update, index) => (
                      <div
                        key={`${employee._id}-${index}`}
                        className="px-6 py-4"
                      >
                        <div className="flex items-center justify-between">

                          <div>

                            <p className="font-medium text-slate-800">
                              {employee.name}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                              {update.updateText}
                            </p>

                          </div>

                          <Badge
                            status={
                              update.status ===
                              "reviewed"
                                ? "active"
                                : "pending"
                            }
                            label={update.status}
                          />

                        </div>

                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(
                            update.date
                          ).toLocaleDateString()}
                        </p>

                        {update.comments && (
                          <div className="mt-2 bg-blue-50 text-blue-700 text-sm rounded-lg p-2">
                            Feedback: {update.comments}
                          </div>
                        )}

                      </div>
                    )
                  )
                )}

              </div>
            )}

          </CardBody>
        </Card>

        {/* LEAVE REQUESTS */}

        <Card className="lg:col-span-2">
          <CardHeader title="Pending Leave Requests" />

          <CardBody className="p-0">

            {leaves.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">
                No pending leave requests
              </p>
            ) : (
              <div className="divide-y divide-slate-100">

                {leaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="px-6 py-4"
                  >
                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-medium text-slate-800">
                          {leave.employee?.firstName}{" "}
                          {leave.employee?.lastName}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          {new Date(
                            leave.fromDate
                          ).toLocaleDateString()}
                          {" → "}
                          {new Date(
                            leave.toDate
                          ).toLocaleDateString()}
                        </p>

                        <p className="text-xs text-slate-400">
                          {leave.reason}
                        </p>

                      </div>

                      <Badge status="pending" />

                    </div>
                  </div>
                ))}

              </div>
            )}

          </CardBody>
        </Card>

      </div>
    </div>
  );
};

export default TechLeadDashboard;