import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listIssues, createIssue, type Issue } from "../api/issues";
import { listMembers, type Member } from "../api/members";
import { listLabels } from "../api/labels";
import { listProjects } from "../api/projects";
import StatusIcon from "../components/StatusIcon";
import PriorityIcon from "../components/PriorityIcon";
import FilterBar from "../components/FilterBar";
import { useIssueFilter } from "../hooks/useIssueFilter";

function AssigneeAvatar({ assigneeId, memberMap }: { assigneeId: string | null; memberMap: Map<string, Member> }) {
  if (!assigneeId) return <span className="w-5 h-5" />;
  const member = memberMap.get(assigneeId);
  if (!member) return <span className="w-5 h-5" />;

  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={member.full_name}
        title={member.full_name}
        className="w-5 h-5 rounded-full object-cover"
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
      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0"
      style={{ backgroundColor: "var(--accent)" }}
      title={member.full_name}
    >
      {initials}
    </div>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function IssuesPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { filters, toggleStatus, togglePriority, toggleLabel, reset, hasActiveFilters, toQueryParams } = useIssueFilter();

  const { data: issues = [], isLoading, isError } = useQuery({
    queryKey: ["issues", projectId, filters],
    queryFn: () => listIssues(projectId!, toQueryParams()),
    enabled: !!projectId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => listMembers(workspaceId!),
    enabled: !!workspaceId,
  });

  const { data: labels = [] } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => listLabels(workspaceId!),
    enabled: !!workspaceId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => listProjects(workspaceId!),
    enabled: !!workspaceId,
  });

  const project = projects.find((p) => p.id === projectId);
  const memberMap = new Map(members.map((m) => [m.user_id, m]));

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      createIssue(projectId!, { title, status: "todo", priority: "no_priority" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
      setNewTitle("");
      setShowForm(false);
    },
  });

  const handleCreate = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate(newTitle.trim());
  };

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
    <div className="flex flex-col h-full" style={{ color: "var(--text-primary)" }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Issues
          </h1>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {issues.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <FilterBar
            filters={filters}
            onToggleStatus={toggleStatus}
            onTogglePriority={togglePriority}
            onToggleLabel={toggleLabel}
            onReset={reset}
            hasActiveFilters={hasActiveFilters}
            labels={labels}
          />
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-md transition-colors"
            style={{ backgroundColor: "var(--accent)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
          >
            <span className="text-base leading-none">+</span> New Issue
          </button>
        </div>
      </div>

      {/* Inline create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex items-center gap-3 px-6 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--content-alt)" }}
        >
          <StatusIcon status="todo" className="w-4 h-4 shrink-0" />
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Issue title..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            onKeyDown={(e) => e.key === "Escape" && setShowForm(false)}
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newTitle.trim()}
            className="text-xs font-medium text-white px-3 py-1.5 rounded-md disabled:opacity-40 transition-colors"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {createMutation.isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-xs px-3 py-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Issue list */}
      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--text-tertiary)" }}>
          <svg className="w-10 h-10 mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
          <p className="text-sm font-medium mb-1">No issues yet</p>
          <p className="text-xs opacity-60">Create your first issue to get started</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {issues.map((issue, index) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              index={index}
              identifier={project?.identifier ?? ""}
              workspaceId={workspaceId!}
              projectId={projectId!}
              memberMap={memberMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({
  issue,
  index,
  identifier,
  workspaceId,
  projectId,
  memberMap,
}: {
  issue: Issue;
  index: number;
  identifier: string;
  workspaceId: string;
  projectId: string;
  memberMap: Map<string, Member>;
}) {
  const issueCode = identifier ? `${identifier}-${index + 1}` : `#${index + 1}`;
  const isDone = issue.status === "done" || issue.status === "cancelled";

  return (
    <Link
      to={`/workspaces/${workspaceId}/projects/${projectId}/issues/${issue.id}`}
      className="flex items-center gap-3 px-6 py-2.5 text-sm group transition-colors"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        color: "var(--text-primary)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
    >
      <StatusIcon status={issue.status} className="w-3.5 h-3.5 shrink-0" />

      <span
        className="text-[11px] font-mono shrink-0 w-16"
        style={{ color: "var(--text-tertiary)" }}
      >
        {issueCode}
      </span>

      <span
        className={`flex-1 truncate text-sm ${isDone ? "line-through opacity-50" : ""}`}
        style={{ color: "var(--text-primary)" }}
      >
        {issue.title}
      </span>

      <PriorityIcon priority={issue.priority} className="w-3.5 h-3.5 shrink-0" />

      <AssigneeAvatar assigneeId={issue.assignee_id} memberMap={memberMap} />

      {issue.due_date && (
        <span className="text-[11px] w-16 text-right shrink-0" style={{ color: "var(--text-tertiary)" }}>
          {formatDate(issue.due_date)}
        </span>
      )}
    </Link>
  );
}
