import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listWorkspaces, type Workspace } from "../api/workspaces";

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const initial = workspace.name.charAt(0).toUpperCase();

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 transition-all duration-150"
      style={{ backgroundColor: "var(--content-bg)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Icon + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: "linear-gradient(135deg, var(--accent), #8b5cf6)" }}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {workspace.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
            /{workspace.slug}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/workspaces/${workspace.id}/projects`}
          className="flex-1 text-center text-xs font-medium text-white py-2 rounded-md transition-colors"
          style={{ backgroundColor: "var(--accent)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
        >
          Open
        </Link>
        <Link
          to={`/workspaces/${workspace.id}/members`}
          className="flex-1 text-center text-xs font-medium py-2 rounded-md transition-colors"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}>
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        Failed to load workspaces.
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div
        className="flex items-center justify-between mb-6 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Workspaces
        </h1>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {workspaces.length} {workspaces.length === 1 ? "workspace" : "workspaces"}
        </span>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--text-tertiary)" }}>
          <svg className="w-10 h-10 mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <p className="text-sm font-medium mb-1">No workspaces yet</p>
          <p className="text-xs opacity-60">Create your first workspace to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  );
}
