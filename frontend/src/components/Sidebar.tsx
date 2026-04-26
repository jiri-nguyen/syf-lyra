import { Link, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/auth";
import { useCommandPalette } from "../contexts/CommandPaletteContext";

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors mx-2 ${
        active
          ? "bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]"
          : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]"
      }`}
    >
      <span className="w-4 h-4 shrink-0">{icon}</span>
      {label}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-text)] opacity-50 select-none">
      {label}
    </p>
  );
}

const HomeIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z" />
  </svg>
);

const BoardIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm4 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zm4 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" />
  </svg>
);

const FolderIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139q.323-.119.684-.12h5.396z" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
  </svg>
);

const IssuesIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
  </svg>
);

export default function Sidebar() {
  const { workspaceId, projectId } = useParams<{
    workspaceId?: string;
    projectId?: string;
  }>();
  const location = useLocation();
  const { setOpen } = useCommandPalette();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  });

  const initials = me?.full_name
    ? me.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className="flex flex-col shrink-0 h-screen overflow-hidden"
      style={{ width: "var(--sidebar-width)", backgroundColor: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Workspace header */}
      <div
        className="h-12 flex items-center gap-2.5 px-4 cursor-pointer shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: "var(--accent)" }}
        >
          L
        </div>
        <span className="text-sm font-semibold truncate flex-1" style={{ color: "var(--sidebar-text-active)" }}>
          Linear Clone
        </span>
        <ChevronDownIcon />
      </div>

      {/* Search / Command palette trigger */}
      <div className="px-2 py-2" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs transition-colors"
          style={{ color: "var(--sidebar-text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sidebar-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          <SearchIcon />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="font-mono text-[10px] opacity-50">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <SectionLabel label="General" />
        <NavItem
          to="/workspaces"
          icon={<HomeIcon />}
          label="Workspaces"
          active={isActive("/workspaces")}
        />

        {workspaceId && (
          <>
            <NavItem
              to={`/workspaces/${workspaceId}/projects`}
              icon={<FolderIcon />}
              label="Projects"
              active={isActive(`/workspaces/${workspaceId}/projects`)}
            />
            <NavItem
              to={`/workspaces/${workspaceId}/members`}
              icon={<UsersIcon />}
              label="Members"
              active={isActive(`/workspaces/${workspaceId}/members`)}
            />
          </>
        )}

        {workspaceId && projectId && (
          <>
            <SectionLabel label="Project" />
            <NavItem
              to={`/workspaces/${workspaceId}/projects/${projectId}/board`}
              icon={<BoardIcon />}
              label="Board"
              active={location.pathname.endsWith("/board")}
            />
            <NavItem
              to={`/workspaces/${workspaceId}/projects/${projectId}/issues`}
              icon={<IssuesIcon />}
              label="Issues"
              active={location.pathname.endsWith("/issues")}
            />
          </>
        )}
      </nav>

      {/* Current user */}
      <div
        className="px-4 py-3 flex items-center gap-2.5 shrink-0"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {initials}
        </div>
        <span className="text-xs truncate" style={{ color: "var(--sidebar-text)" }}>
          {me?.email ?? "Loading..."}
        </span>
      </div>
    </div>
  );
}
