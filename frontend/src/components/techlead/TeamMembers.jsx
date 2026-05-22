import React, { useEffect, useState } from "react";

import {
  getTeamMembers,
} from "../../services/techLeadService";

export default function TeamMembers() {
  const [members, setMembers] =
    useState([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data } =
        await getTeamMembers();

      setMembers(data);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>

      <h2 className="text-xl font-semibold mb-4">
        Team Members
      </h2>

      <div className="space-y-3">

        {members.length === 0 ? (
          <p className="text-slate-500">
            No team members found
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member._id}
              className="border rounded-lg p-3 flex items-center justify-between"
            >
              <div>

                <h3 className="font-semibold">
                  {member.name}
                </h3>

                <p className="text-sm text-slate-500">
                  {member.email}
                </p>

              </div>

              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {member.designation ||
                  "Employee"}
              </span>

            </div>
          ))
        )}

      </div>
    </div>
  );
}