import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Issue } from "../../api/issues";
import KanbanCard from "./KanbanCard";

const STATUS_STYLES: Record<Issue["status"], string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<Issue["status"], string> = {
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

interface Props {
  status: Issue["status"];
  issues: Issue[];
  projectId: string; // ← thêm
}

export default function KanbanColumn({ status, issues, projectId }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-gray-400">{issues.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-colors ${
          isOver ? "bg-blue-50 ring-2 ring-blue-200" : "bg-gray-50"
        }`}
      >
        <SortableContext
          items={issues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <KanbanCard key={issue.id} issue={issue} projectId={projectId} /> // ← thêm projectId
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-4">Kéo issue vào đây</p>
        )}
      </div>
    </div>
  );
}