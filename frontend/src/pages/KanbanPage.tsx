import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { listIssues } from "../api/issues";
import KanbanBoard from "../components/kanban/KanbanBoard";
import FilterBar from "../components/FilterBar";
import { useIssueFilter } from "../hooks/useIssueFilter";

export default function KanbanPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    filters,
    toggleStatus,
    togglePriority,
    reset,
    hasActiveFilters,
    toQueryParams,
  } = useIssueFilter();

  const { data: issues = [], isLoading, isError } = useQuery({
    queryKey: ["issues", projectId, filters],
    queryFn: () => listIssues(projectId!, toQueryParams()),
    enabled: !!projectId,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading...
    </div>
  );

  if (isError) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      Không thể tải issues.
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Board</h1>

        <FilterBar
          filters={filters}
          onToggleStatus={toggleStatus}
          onTogglePriority={togglePriority}
          onReset={reset}
          hasActiveFilters={hasActiveFilters}
        />

        <div className="mt-6">
          <KanbanBoard projectId={projectId!} issues={issues} />
        </div>
      </div>
    </div>
  );
}