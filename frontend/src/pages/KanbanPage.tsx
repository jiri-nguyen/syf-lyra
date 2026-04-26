import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { listIssues } from "../api/issues";
import { listLabels } from "../api/labels";
import KanbanBoard from "../components/kanban/KanbanBoard";
import FilterBar from "../components/FilterBar";
import { useIssueFilter } from "../hooks/useIssueFilter";
import { useProjectWebSocket } from "../hooks/useProjectWebSocket";

export default function KanbanPage() {
  const { projectId, workspaceId } = useParams<{ projectId: string; workspaceId: string }>();
  const { filters, toggleStatus, togglePriority, toggleLabel, reset, hasActiveFilters, toQueryParams } =
    useIssueFilter();

  const { data: issues = [], isLoading, isError } = useQuery({
    queryKey: ["issues", projectId, filters],
    queryFn: () => listIssues(projectId!, toQueryParams()),
    enabled: !!projectId,
  });

  useProjectWebSocket(projectId);

  const { data: labels = [] } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => listLabels(workspaceId!),
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
        Failed to load issues.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Board
          </h1>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {issues.length}
          </span>
        </div>
        <FilterBar
          filters={filters}
          onToggleStatus={toggleStatus}
          onTogglePriority={togglePriority}
          onToggleLabel={toggleLabel}
          onReset={reset}
          hasActiveFilters={hasActiveFilters}
          labels={labels}
        />
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto px-6 pt-5">
        <KanbanBoard workspaceId={workspaceId!} projectId={projectId!} issues={issues} />
      </div>
    </div>
  );
}
