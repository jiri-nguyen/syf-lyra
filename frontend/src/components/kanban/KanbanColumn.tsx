import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Issue } from "../../api/issues";
import KanbanCard from "./KanbanCard";
import StatusIcon from "../StatusIcon";

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
  workspaceId: string;
  projectId: string;
}

export default function KanbanColumn({ status, issues, workspaceId, projectId }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <StatusIcon status={status} className="w-3.5 h-3.5 shrink-0" />
        <span
          className="text-xs font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          {STATUS_LABELS[status]}
        </span>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            color: "var(--text-tertiary)",
            backgroundColor: "var(--content-alt)",
          }}
        >
          {issues.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-all duration-150"
        style={{
          backgroundColor: isOver ? "rgba(94, 106, 210, 0.05)" : "transparent",
          outline: isOver ? "1px solid rgba(94, 106, 210, 0.2)" : "none",
        }}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <KanbanCard
              key={issue.id}
              issue={issue}
              workspaceId={workspaceId}
              projectId={projectId}
            />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-8"
            style={{ color: "var(--text-tertiary)" }}
          >
            <svg
              className="w-6 h-6 opacity-20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
              />
            </svg>
            <p className="text-xs mt-2 opacity-40">No issues</p>
          </div>
        )}
      </div>
    </div>
  );
}
