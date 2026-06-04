import React, { useEffect, useState } from "react";

import {
  getEmployeeUpdates,
} from "../../services/techLeadService";

export default function DailyUpdates() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const { data } =
        await getEmployeeUpdates();

      setEmployees(data);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>

      <h2 className="text-xl font-semibold mb-4">
        Daily Updates
      </h2>

      <div className="space-y-4">

        {employees.length === 0 ? (
          <p className="text-slate-500">
            No updates found
          </p>
        ) : (
          employees.map((employee) =>
            employee.dailyUpdates?.map(
              (update, index) => (
                <div
                  key={`${employee._id}-${index}`}
                  className="border rounded-lg p-4"
                >
                  <div className="flex justify-between">

                    <div>

                      <h3 className="font-semibold">
                        {employee.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {new Date(
                          update.date
                        ).toLocaleDateString()}
                      </p>

                    </div>

                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        update.status === "reviewed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {update.status}
                    </span>

                  </div>

                  <p className="mt-3 text-slate-700">
                    {update.updateText}
                  </p>

                  {update.comments && (
                    <div className="mt-3 bg-blue-50 text-blue-700 text-sm rounded p-2">
                      Feedback: {update.comments}
                    </div>
                  )}

                </div>
              )
            )
          )
        )}

      </div>
    </div>
  );
}