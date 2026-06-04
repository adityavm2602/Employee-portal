import React, { useEffect, useState } from "react";

import {
  getLeaveRequests,
  approveLeave,
  rejectLeave,
} from "../../services/techLeadService";

export default function LeaveRequests() {
  const [employees, setEmployees] =
    useState([]);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const { data } =
        await getLeaveRequests();

      setEmployees(data);

    } catch (error) {
      console.log(error);
    }
  };

  const handleApprove = async (
    employeeId,
    leaveIndex
  ) => {
    await approveLeave(
      employeeId,
      leaveIndex
    );

    fetchLeaves();
  };

  const handleReject = async (
    employeeId,
    leaveIndex
  ) => {
    await rejectLeave(
      employeeId,
      leaveIndex
    );

    fetchLeaves();
  };

  return (
    <div>

      <h2 className="text-xl font-semibold mb-4">
        Leave Requests
      </h2>

      <div className="space-y-4">

        {employees.map((employee) =>
          employee.leaveRequests?.map(
            (leave, index) => (
              <div
                key={index}
                className="border rounded-lg p-4"
              >
                <h3 className="font-semibold">
                  {employee.name}
                </h3>

                <p className="text-sm mt-1">
                  {leave.reason}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {new Date(
                    leave.fromDate
                  ).toLocaleDateString()}
                  {" → "}
                  {new Date(
                    leave.toDate
                  ).toLocaleDateString()}
                </p>

                <div className="flex gap-2 mt-3">

                  <button
                    onClick={() =>
                      handleApprove(
                        employee._id,
                        index
                      )
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      handleReject(
                        employee._id,
                        index
                      )
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>

                </div>
              </div>
            )
          )
        )}

      </div>
    </div>
  );
}