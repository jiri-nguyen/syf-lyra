import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCommandPalette } from "../contexts/CommandPaletteContext";
import StatusIcon from "./StatusIcon";
import type { Issue } from "../api/issues";
import type { Project } from "../api/projects";

// ── Result types ───────────────────────────────────────────────────────────

interface ResultItem {
  id: string;
  type: "issue" | "project" | "nav";
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  href: string;
}

// ── Icons ──────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
    <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4z" />
  </svg>
);

const NavIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
    <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708" />
  </svg>
);

// ── URL parsing ────────────────────────────────────────────────────────────

function parseUrlParams(pathname: string) {
  // /workspaces/:workspaceId/projects/:projectId/...
  const parts = pathname.split("/");
  const workspaceIdx = parts.indexOf("workspaces");
  const projectIdx = parts.indexOf("projects");
  return {
    workspaceId: workspaceIdx >= 0 ? parts[workspaceIdx + 1] : undefined,
    projectId: projectIdx >= 0 ? parts[projectIdx + 1] : undefined,
  };
}

// ── Cache search ───────────────────────────────────────────────────────────

function useSearchResults(query: string) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { workspaceId, projectId } = parseUrlParams(location.pathname);

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    const allQueries = queryClient.getQueryCache().getAll();

    // Build project map from cache
    const projectQueries = allQueries.filter((qc) => qc.queryKey[0] === "projects");
    const allProjects: Project[] = projectQueries.flatMap(
      (pq) => (pq.state.data as Project[] | undefined) ?? []
    );
    const projectMap = new Map(allProjects.map((p) => [p.id, p]));

    // Default nav items (always shown when no query)
    const navItems: ResultItem[] = [
      { id: "nav-workspaces", type: "nav", label: "Go to Workspaces", icon: <NavIcon />, href: "/workspaces" },
      ...(workspaceId
        ? [{ id: "nav-projects", type: "nav" as const, label: "Go to Projects", icon: <NavIcon />, href: `/workspaces/${workspaceId}/projects` }]
        : []),
      ...(workspaceId
        ? [{ id: "nav-members", type: "nav" as const, label: "Go to Members", icon: <NavIcon />, href: `/workspaces/${workspaceId}/members` }]
        : []),
      ...(workspaceId && projectId
        ? [
            { id: "nav-board", type: "nav" as const, label: "Go to Board", icon: <NavIcon />, href: `/workspaces/${workspaceId}/projects/${projectId}/board` },
            { id: "nav-issues", type: "nav" as const, label: "Go to Issues", icon: <NavIcon />, href: `/workspaces/${workspaceId}/projects/${projectId}/issues` },
          ]
        : []),
    ];

    if (!q) return { items: navItems, hasQuery: false };

    // Filter nav items
    const matchedNav = navItems.filter((n) => n.label.toLowerCase().includes(q));

    // Search projects
    const matchedProjects: ResultItem[] = allProjects
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({
        id: `project-${p.id}`,
        type: "project" as const,
        label: p.name,
        sublabel: p.identifier,
        icon: <FolderIcon />,
        href: `/workspaces/${p.workspace_id}/projects/${p.id}/board`,
      }));

    // Search issues from cache
    const issueQueries = allQueries.filter((qc) => qc.queryKey[0] === "issues");
    const seenIds = new Set<string>();
    const matchedIssues: ResultItem[] = [];

    for (const iq of issueQueries) {
      const data = iq.state.data as Issue[] | undefined;
      if (!Array.isArray(data)) continue;
      const pid = iq.queryKey[1] as string;
      const project = projectMap.get(pid);
      if (!project) continue;

      for (const issue of data) {
        if (seenIds.has(issue.id)) continue;
        if (!issue.title.toLowerCase().includes(q)) continue;
        seenIds.add(issue.id);
        matchedIssues.push({
          id: `issue-${issue.id}`,
          type: "issue",
          label: issue.title,
          sublabel: project.name,
          icon: <StatusIcon status={issue.status} className="w-3.5 h-3.5" />,
          href: `/workspaces/${project.workspace_id}/projects/${pid}/issues/${issue.id}`,
        });
        if (matchedIssues.length >= 8) break;
      }
      if (matchedIssues.length >= 8) break;
    }

    return {
      items: [...matchedNav, ...matchedProjects, ...matchedIssues],
      hasQuery: true,
    };
  }, [query, queryClient, workspaceId, projectId]);
}

// ── Result item component ──────────────────────────────────────────────────

function PaletteItem({
  item,
  selected,
  onSelect,
}: {
  item: ResultItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <button
      ref={ref}
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
      style={{
        backgroundColor: selected ? "var(--content-alt)" : "transparent",
        color: "var(--text-primary)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = selected ? "var(--content-alt)" : "transparent")
      }
    >
      <span style={{ color: "var(--text-tertiary)" }}>{item.icon}</span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.sublabel && (
        <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
          {item.sublabel}
        </span>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { items } = useSearchResults(query);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Clamp selected index when items change
  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  const handleSelect = (item: ResultItem) => {
    navigate(item.href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) handleSelect(items[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: "15vh", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full mx-4 rounded-xl overflow-hidden"
        style={{
          maxWidth: "560px",
          backgroundColor: "var(--content-bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span style={{ color: "var(--text-tertiary)" }}>
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search issues, projects, navigate..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "var(--text-primary)" }}
          />
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded font-mono select-none"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-tertiary)",
              backgroundColor: "var(--content-alt)",
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1.5">
          {items.length === 0 ? (
            <p
              className="text-sm text-center py-10"
              style={{ color: "var(--text-tertiary)" }}
            >
              No results for "{query}"
            </p>
          ) : (
            items.map((item, i) => (
              <PaletteItem
                key={item.id}
                item={item}
                selected={i === selectedIndex}
                onSelect={() => handleSelect(item)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--text-tertiary)",
          }}
        >
          {(["↑↓ navigate", "↵ open", "esc close"] as const).map((hint) => (
            <span key={hint} className="text-[10px]">
              <kbd className="font-mono">{hint.split(" ")[0]}</kbd>{" "}
              <span style={{ opacity: 0.6 }}>{hint.split(" ").slice(1).join(" ")}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
