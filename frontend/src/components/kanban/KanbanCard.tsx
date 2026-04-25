import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
}

export default function KanbanCard({ issue }: Props) {
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
      {...attributes}
      {...listeners}
      className="bg-white border rounded-lg px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing select-none"
    >
      <p className="text-sm text-gray-800 leading-snug">{issue.title}</p>
      <div className="flex items-center gap-2 mt-2">
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