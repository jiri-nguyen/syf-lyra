import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue } from "../../api/issues";
import { updateIssue } from "../../api/issues";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";

const STATUSES: Issue["status"][] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
];

interface Props {
  workspaceId: string;
  projectId: string;
  issues: Issue[];
}

export default function KanbanBoard({ workspaceId, projectId, issues }: Props) {
  const queryClient = useQueryClient();
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const updateMutation = useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: Issue["status"] }) =>
      updateIssue(projectId, issueId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
    },
  });

  const issuesByStatus = STATUSES.reduce<Record<Issue["status"], Issue[]>>(
    (acc, status) => {
      acc[status] = issues.filter((i) => i.status === status);
      return acc;
    },
    {} as Record<Issue["status"], Issue[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    const issue = issues.find((i) => i.id === event.active.id);
    setActiveIssue(issue ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const draggedIssue = issues.find((i) => i.id === active.id);
    if (!draggedIssue) return;

    const targetStatus = STATUSES.includes(over.id as Issue["status"])
      ? (over.id as Issue["status"])
      : issues.find((i) => i.id === over.id)?.status;

    if (!targetStatus || draggedIssue.status === targetStatus) return;

    queryClient.setQueryData<Issue[]>(["issues", projectId], (old = []) =>
      old.map((i) => (i.id === draggedIssue.id ? { ...i, status: targetStatus } : i))
    );

    updateMutation.mutate({ issueId: draggedIssue.id, status: targetStatus });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            issues={issuesByStatus[status]}
            workspaceId={workspaceId}
            projectId={projectId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIssue && (
          <div className="rotate-2 scale-105">
            <KanbanCard issue={activeIssue} workspaceId={workspaceId} projectId={projectId} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}