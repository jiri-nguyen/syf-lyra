import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { listProjects, type Project } from "../api/projects";
import Breadcrumb from "../components/Breadcrumb";

const BoardIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm4 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zm4 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
  </svg>
);

function ProjectCard({ project, workspaceId }: { project: Project; workspaceId: string }) {
  const initial = project.name.charAt(0).toUpperCase();

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
      {/* Icon + name + identifier */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg, #6366f1, var(--accent))" }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {project.name}
            </p>
            <span
              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0"
              style={{
                backgroundColor: "rgba(94,106,210,0.1)",
                color: "var(--accent)",
                border: "1px solid rgba(94,106,210,0.2)",
              }}
            >
              {project.identifier}
            </span>
          </div>
          {project.description && (
            <p className="text-xs line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* View links */}
      <div className="flex gap-2">
        <Link
          to={`/workspaces/${workspaceId}/projects/${project.id}/board`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white py-2 rounded-md transition-colors"
          style={{ backgroundColor: "var(--accent)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
        >
          <BoardIcon />
          Board
        </Link>
        <Link
          to={`/workspaces/${workspaceId}/projects/${project.id}/issues`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-md transition-colors"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          <ListIcon />
          Issues
        </Link>
      </div>
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
        Failed to load projects.
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
        <div className="flex flex-col gap-1">
          <Breadcrumb items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Projects" }]} />
          <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Projects
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
          <Link
            to={`/workspaces/${workspaceId}/members`}
            className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            Members
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--text-tertiary)" }}>
          <svg className="w-10 h-10 mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <p className="text-sm font-medium mb-1">No projects yet</p>
          <p className="text-xs opacity-60">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} workspaceId={workspaceId!} />
          ))}
        </div>
      )}
    </div>
  );
}
