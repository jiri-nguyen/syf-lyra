import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listComments, createComment, updateComment, deleteComment, type Comment } from "../api/comments";
import { listProjects } from "../api/projects";
import { getMe } from "../api/auth";
import client from "../api/client";
import type { Issue, IssueDetail } from "../api/issues";
import LabelPicker from "../components/LabelPicker";
import StatusIcon from "../components/StatusIcon";
import PriorityIcon from "../components/PriorityIcon";
import Breadcrumb from "../components/Breadcrumb";

// ── API ────────────────────────────────────────────────────────────────────

const getIssue = (projectId: string, issueId: string) =>
  client.get<IssueDetail>(`/projects/${projectId}/issues/${issueId}`).then((r) => r.data);

const patchIssue = (projectId: string, issueId: string, data: Partial<IssueDetail>) =>
  client.patch<IssueDetail>(`/projects/${projectId}/issues/${issueId}`, data).then((r) => r.data);

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Status & Priority dropdowns ────────────────────────────────────────────

const STATUS_OPTIONS: Issue["status"][] = ["todo", "in_progress", "in_review", "done", "cancelled"];
const STATUS_LABELS: Record<Issue["status"], string> = {
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

const PRIORITY_OPTIONS: Issue["priority"][] = ["no_priority", "urgent", "high", "medium", "low"];
const PRIORITY_LABELS: Record<Issue["priority"], string> = {
  no_priority: "No priority",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function StatusDropdown({ value, onChange }: { value: Issue["status"]; onChange: (v: Issue["status"]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors"
        style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
      >
        <StatusIcon status={value} className="w-3.5 h-3.5" />
        <span>{STATUS_LABELS[value]}</span>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-44 rounded-lg py-1 z-50"
          style={{ backgroundColor: "var(--content-bg)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              <StatusIcon status={s} className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1">{STATUS_LABELS[s]}</span>
              {s === value && <span style={{ color: "var(--accent)" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityDropdown({ value, onChange }: { value: Issue["priority"]; onChange: (v: Issue["priority"]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors"
        style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
      >
        <PriorityIcon priority={value} className="w-3.5 h-3.5" />
        <span>{PRIORITY_LABELS[value]}</span>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-44 rounded-lg py-1 z-50"
          style={{ backgroundColor: "var(--content-bg)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => { onChange(p); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              <PriorityIcon priority={p} className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1">{PRIORITY_LABELS[p]}</span>
              {p === value && <span style={{ color: "var(--accent)" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline edit ────────────────────────────────────────────────────────────

function InlineEdit({ value, onSave, multiline = false, placeholder = "Click to edit..." }: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    if (draft.trim() && draft !== value) onSave(draft.trim());
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) { e.preventDefault(); handleSave(); }
    if (e.key === "Escape") { setDraft(value); setEditing(false); }
  };

  if (!editing) {
    return (
      <div
        onClick={() => { setDraft(value); setEditing(true); }}
        className="cursor-text rounded px-1 -mx-1 transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
      >
        {value || <span className="italic opacity-30">{placeholder}</span>}
      </div>
    );
  }

  const sharedClass = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none";
  const sharedStyle = {
    border: "1px solid var(--accent)",
    boxShadow: "0 0 0 3px rgba(94,106,210,0.15)",
    color: "var(--text-primary)",
    backgroundColor: "var(--content-bg)",
  };

  return multiline ? (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      rows={5}
      className={sharedClass}
      style={sharedStyle}
    />
  ) : (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className={sharedClass}
      style={sharedStyle}
    />
  );
}

// ── Comment item ───────────────────────────────────────────────────────────

function CommentItem({ comment, issueId, currentUserId }: {
  comment: Comment;
  issueId: string;
  currentUserId: string | undefined;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const isOwner = currentUserId === comment.author_id;

  const updateMutation = useMutation({
    mutationFn: (content: string) => updateComment(issueId, comment.id, content),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["comments", issueId] }); setEditing(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(issueId, comment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", issueId] }),
  });

  const initials = comment.author_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0 mt-0.5"
        style={{ backgroundColor: "var(--accent)" }}
        title={comment.author_name}
      >
        {comment.author_avatar
          ? <img src={comment.author_avatar} alt={comment.author_name} className="w-7 h-7 rounded-full object-cover" />
          : initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {comment.author_name}
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {timeAgo(comment.created_at)}
          </span>
          {comment.created_at !== comment.updated_at && (
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>(edited)</span>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{
                border: "1px solid var(--accent)",
                boxShadow: "0 0 0 3px rgba(94,106,210,0.15)",
                color: "var(--text-primary)",
                backgroundColor: "var(--content-bg)",
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate(draft)}
                disabled={updateMutation.isPending}
                className="text-xs text-white px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Save
              </button>
              <button
                onClick={() => { setDraft(comment.content); setEditing(false); }}
                className="text-xs px-3 py-1.5 rounded-md transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <div
              className="rounded-lg px-4 py-3 text-sm whitespace-pre-wrap"
              style={{ backgroundColor: "var(--content-alt)", color: "var(--text-secondary)" }}
            >
              {comment.content}
            </div>
            {isOwner && (
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs px-2 py-0.5 rounded transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  className="text-xs px-2 py-0.5 rounded transition-colors text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Properties panel ────────────────────────────────────────────────────────

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <span className="text-xs w-20 shrink-0" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function IssueDetailPage() {
  const { workspaceId, projectId, issueId } = useParams<{
    workspaceId: string;
    projectId: string;
    issueId: string;
  }>();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: issue, isLoading } = useQuery({
    queryKey: ["issue", projectId, issueId],
    queryFn: () => getIssue(projectId!, issueId!),
    enabled: !!(projectId && issueId),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", issueId],
    queryFn: () => listComments(issueId!),
    enabled: !!issueId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => listProjects(workspaceId!),
    enabled: !!workspaceId,
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  });

  const project = projects.find((p) => p.id === projectId);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<IssueDetail>) => patchIssue(projectId!, issueId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", projectId, issueId] });
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => createComment(issueId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", issueId] });
      setNewComment("");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}>
        Loading...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        Issue not found.
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Projects", href: `/workspaces/${workspaceId}/projects` },
    ...(project ? [{ label: project.name, href: `/workspaces/${workspaceId}/projects/${projectId}/board` }] : []),
    { label: issue.title.length > 48 ? issue.title.slice(0, 48) + "…" : issue.title },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <Breadcrumb items={breadcrumbItems} />

        {/* Title */}
        <div className="mt-5 mb-6">
          <div className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            <InlineEdit
              value={issue.title}
              onSave={(title) => updateMutation.mutate({ title })}
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Description
          </p>
          <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <InlineEdit
              value={issue.description ?? ""}
              onSave={(description) => updateMutation.mutate({ description })}
              multiline
              placeholder="Add a description..."
            />
          </div>
        </div>

        {/* Activity / Comments */}
        <div>
          <p className="text-xs font-medium mb-4 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Activity {comments.length > 0 && `· ${comments.length}`}
          </p>

          <div className="flex flex-col gap-5 mb-6">
            {commentsLoading ? (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-tertiary)", opacity: 0.5 }}>
                No activity yet
              </p>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  issueId={issueId!}
                  currentUserId={me?.id}
                />
              ))
            )}
          </div>

          {/* New comment */}
          <div
            className="pt-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a comment..."
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                backgroundColor: "var(--content-bg)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(94,106,210,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => { if (newComment.trim()) addCommentMutation.mutate(newComment.trim()); }}
                disabled={addCommentMutation.isPending || !newComment.trim()}
                className="text-sm text-white px-4 py-2 rounded-lg disabled:opacity-40 transition-colors"
                style={{ backgroundColor: "var(--accent)" }}
                onMouseEnter={(e) => { if (!addCommentMutation.isPending && newComment.trim()) e.currentTarget.style.backgroundColor = "var(--accent-hover)"; }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
              >
                {addCommentMutation.isPending ? "Sending..." : "Comment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Properties sidebar ── */}
      <div
        className="w-64 shrink-0 overflow-y-auto px-5 py-6"
        style={{ borderLeft: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
          Properties
        </p>

        <PropertyRow label="Status">
          <StatusDropdown
            value={issue.status}
            onChange={(status) => updateMutation.mutate({ status })}
          />
        </PropertyRow>

        <PropertyRow label="Priority">
          <PriorityDropdown
            value={issue.priority}
            onChange={(priority) => updateMutation.mutate({ priority })}
          />
        </PropertyRow>

        <PropertyRow label="Labels">
          <LabelPicker issueId={issueId!} workspaceId={workspaceId!} />
        </PropertyRow>

        <PropertyRow label="Created">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {new Date(issue.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </PropertyRow>

        {issue.due_date && (
          <PropertyRow label="Due">
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {new Date(issue.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </PropertyRow>
        )}
      </div>
    </div>
  );
}
