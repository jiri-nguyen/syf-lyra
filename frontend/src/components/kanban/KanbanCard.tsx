import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import type { Issue } from "../../api/issues";

const PRIORITY_COLORS: Record<Issue["priority"], string> = {
  no_priority: "bg-gray-100 text-gray-400",
  urgent: "bg-red-100 text-red-600",
  high: "bg-orange-100 text-orange-600",
  medium: "bg-yellow-100 text-yellow-600",
  low: "bg-blue-100 text-blue-500",
};

interface Props {
  issue: Issue;
  projectId: string; // thêm mới
}

export default function KanbanCard({ issue, projectId }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg px-3 py-2.5 shadow-sm select-none"
    >
      <div className="flex items-start gap-2">
        {/* Drag handle — chỉ phần này mới kéo được */}
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 shrink-0"
        >
          ⠿
        </div>

        {/* Title — click để navigate */}
        <Link
          to={`/projects/${projectId}/issues/${issue.id}`}
          className="flex-1 text-sm text-gray-800 hover:text-blue-600 leading-snug"
        >
          {issue.title}
        </Link>
      </div>

      <div className="flex items-center gap-2 mt-2 pl-5">
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[issue.priority]}`}>
          {issue.priority.replace("_", " ")}
        </span>
        {issue.due_date && (
          <span className="text-xs text-gray-400">
            {new Date(issue.due_date).toLocaleDateString("vi-VN")}
          </span>
        )}
      </div>
    </div>
  );
}