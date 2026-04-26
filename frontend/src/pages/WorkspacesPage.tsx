import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listWorkspaces, type Workspace } from "../api/workspaces";

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-4">
      <div>
        <p className="text-base font-semibold text-gray-900">{workspace.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">/{workspace.slug}</p>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/workspaces/${workspace.id}/projects`}
          className="flex-1 text-center text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
        >
          Projects
        </Link>
        <Link
          to={`/workspaces/${workspace.id}/members`}
          className="flex-1 text-center text-sm border text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          Members
        </Link>
      </div>
    </div>
  );
}

export default function WorkspacesPage() {
  const { data: workspaces = [], isLoading, isError } = useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading...
    </div>
  );

  if (isError) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      Không thể tải workspaces.
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Workspaces</h1>

        {workspaces.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">
            Chưa có workspace nào.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
