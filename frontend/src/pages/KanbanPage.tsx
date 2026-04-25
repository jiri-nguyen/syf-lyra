import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { listIssues } from "../api/issues";
import KanbanBoard from "../components/kanban/KanbanBoard";

export default function KanbanPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: issues = [], isLoading, isError } = useQuery({
    queryKey: ["issues", projectId],
    queryFn: () => listIssues(projectId!),
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
      <div className="px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Board</h1>
        <KanbanBoard projectId={projectId!} issues={issues} />
      </div>
    </div>
  );
}