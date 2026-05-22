import React, { useEffect, useState } from "react";

import {
  getAssignedProjects,
} from "../../services/techLeadService";

export default function ProjectCards() {
  const [projects, setProjects] =
    useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } =
        await getAssignedProjects();

      setProjects(data);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>

      <h2 className="text-xl font-semibold mb-4">
        Assigned Projects
      </h2>

      <div className="space-y-4">

        {projects.length === 0 ? (
          <p>No projects assigned</p>
        ) : (
          projects.map((project) => (
            <div
              key={project._id}
              className="border rounded-lg p-4"
            >
              <h3 className="font-bold">
                {project.title}
              </h3>

              <p className="text-sm text-slate-600 mt-1">
                {project.description}
              </p>

              <div className="mt-3">

                <div className="w-full bg-slate-200 rounded-full h-3">

                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{
                      width: `${
                        project.progress || 0
                      }%`,
                    }}
                  />

                </div>

                <p className="text-sm mt-1">
                  Progress:
                  {" "}
                  {project.progress || 0}%
                </p>

              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}