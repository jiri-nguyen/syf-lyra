import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Issue } from "../../api/issues";
import { listMembers, type Member } from "../../api/members";
import LabelPicker from "../LabelPicker";
import PriorityIcon from "../PriorityIcon";

function AssigneeAvatar({
  assigneeId,
  memberMap,
}: {
  assigneeId: string | null;
  memberMap: Map<string, Member>;
}) {
  if (!assigneeId) return null;
  const member = memberMap.get(assigneeId);
  if (!member) return null;

  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={member.full_name}
        title={member.full_name}
        className="w-4 h-4 rounded-full object-cover shrink-0"
      />
    );
  }

  const initials = member.full_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-semibold shrink-0"
      style={{ backgroundColor: "var(--accent)" }}
      title={member.full_name}
    >
      {initials}
    </div>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M5.5 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-5 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-5 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
    </svg>
  );
}

interface Props {
  issue: Issue;
  workspaceId: string;
  projectId: string;
}

export default function KanbanCard({ issue, workspaceId, projectId }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id });

  const { data: members = [] } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => listMembers(workspaceId),
    staleTime: 5 * 60 * 1000,
  });

  const memberMap = new Map(members.map((m) => [m.user_id, m]));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formattedDate = issue.due_date
    ? new Date(issue.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div ref={setNodeRef} style={style} className="group select-none">
      <div
        className="rounded-lg px-3 py-2.5 transition-all duration-150"
        style={{
          backgroundColor: "var(--content-bg)",
          border: isDragging ? "1px dashed var(--border)" : "1px solid var(--border)",
          opacity: isDragging ? 0.3 : 1,
          boxShadow: isDragging ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={(e) => {
          if (!isDragging)
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 2px rgba(0,0,0,0.06)";
        }}
      >
        {/* Top row: drag handle + priority icon + title */}
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            <GripIcon />
          </div>

          <PriorityIcon priority={issue.priority} className="w-3.5 h-3.5 mt-0.5 shrink-0" />

          <Link
            to={`/workspaces/${workspaceId}/projects/${projectId}/issues/${issue.id}`}
            className="flex-1 text-sm leading-snug transition-colors"
            style={{ color: "var(--text-primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          >
            {issue.title}
          </Link>
        </div>

        {/* Footer row: short ID + labels + date + assignee */}
        <div className="flex items-center gap-2 mt-2 pl-5">
          <span
            className="text-[10px] font-mono shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            #{issue.id.slice(0, 6)}
          </span>

          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <LabelPicker issueId={issue.id} workspaceId={workspaceId} />
          </div>

          {formattedDate && (
            <span className="text-[10px] shrink-0" style={{ color: "var(--text-tertiary)" }}>
              {formattedDate}
            </span>
          )}

          <AssigneeAvatar assigneeId={issue.assignee_id} memberMap={memberMap} />
        </div>
      </div>
    </div>
  );
}
