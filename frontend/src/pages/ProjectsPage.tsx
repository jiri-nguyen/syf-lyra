import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { listProjects, type Project } from "../api/projects";

function IdentifierBadge({ identifier }: { identifier: string }) {
  return (
    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
      {identifier}
    </span>
  );
}

function ProjectCard({ project, workspaceId }: { project: Project; workspaceId: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <IdentifierBadge identifier={project.identifier} />
            <p className="text-sm font-semibold text-gray-900 truncate">{project.name}</p>
          </div>
          {project.description && (
            <p className="text-xs text-gray-400 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      <Link
        to={`/workspaces/${workspaceId}/projects/${project.id}/board`}
        className="text-center text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
      >
        Open Board
      </Link>
    </div>
  );
}

export default function ProjectsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => listProjects(workspaceId!),
    enabled: !!workspaceId,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading...
    </div>
  );

  if (isError) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      Không thể tải projects.
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-10 px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/workspaces"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ← Workspaces
            </Link>
            <span className="text-gray-200">/</span>
            <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
          </div>
          <Link
            to={`/workspaces/${workspaceId}/members`}
            className="text-sm border text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            Members
          </Link>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">
            Chưa có project nào trong workspace này.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} workspaceId={workspaceId!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
