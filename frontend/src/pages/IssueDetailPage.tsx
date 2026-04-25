import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listComments, createComment, updateComment, deleteComment, type Comment } from "../api/comments";
import client from "../api/client";
import type { Issue } from "../api/issues";

// ── API calls ──────────────────────────────────────────────────────────────

const getIssue = (projectId: string, issueId: string) =>
  client.get<Issue>(`/projects/${projectId}/issues/${issueId}`).then((r) => r.data);

const patchIssue = (projectId: string, issueId: string, data: Partial<Issue>) =>
  client.patch<Issue>(`/projects/${projectId}/issues/${issueId}`, data).then((r) => r.data);

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusSelect({ value, onChange }: { value: Issue["status"]; onChange: (v: Issue["status"]) => void }) {
  const options: Issue["status"][] = ["todo", "in_progress", "in_review", "done", "cancelled"];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Issue["status"])}
      className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700"
    >
      {options.map((s) => (
        <option key={s} value={s}>{s.replace("_", " ")}</option>
      ))}
    </select>
  );
}

function PrioritySelect({ value, onChange }: { value: Issue["priority"]; onChange: (v: Issue["priority"]) => void }) {
  const options: Issue["priority"][] = ["no_priority", "urgent", "high", "medium", "low"];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Issue["priority"])}
      className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700"
    >
      {options.map((p) => (
        <option key={p} value={p}>{p.replace("_", " ")}</option>
      ))}
    </select>
  );
}

function InlineEdit({ value, onSave, multiline = false }: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
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
        className="cursor-text hover:bg-gray-50 rounded px-1 -mx-1 transition-colors"
      >
        {value || <span className="text-gray-300 italic">Click để chỉnh sửa...</span>}
      </div>
    );
  }

  return multiline ? (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      rows={4}
      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    />
  ) : (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function CommentItem({
  comment,
  issueId,
  currentUserId,
}: {
  comment: Comment;
  issueId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  const updateMutation = useMutation({
    mutationFn: (content: string) => updateComment(issueId, comment.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", issueId] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(issueId, comment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", issueId] }),
  });

  const isOwner = comment.author_id === currentUserId;
  const timeAgo = new Date(comment.created_at).toLocaleString("vi-VN");

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium shrink-0">
        {comment.author_name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-gray-800">{comment.author_name}</span>
          <span className="text-xs text-gray-400">{timeAgo}</span>
          {comment.created_at !== comment.updated_at && (
            <span className="text-xs text-gray-300">(đã sửa)</span>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate(draft)}
                disabled={updateMutation.isPending}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Lưu
              </button>
              <button
                onClick={() => { setDraft(comment.content); setEditing(false); }}
                className="text-xs border px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            {isOwner && (
              <div className="absolute top-0 right-0 hidden group-hover:flex gap-1">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-100"
                >
                  Sửa
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function IssueDetailPage() {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: issue, isLoading: issueLoading } = useQuery({
    queryKey: ["issue", projectId, issueId],
    queryFn: () => getIssue(projectId!, issueId!),
    enabled: !!(projectId && issueId),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", issueId],
    queryFn: () => listComments(issueId!),
    enabled: !!issueId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Issue>) => patchIssue(projectId!, issueId!, data),
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

  if (issueLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  );

  if (!issue) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">Issue not found</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="grid grid-cols-3 gap-6">

          {/* Main content */}
          <div className="col-span-2 flex flex-col gap-5">

            {/* Title */}
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Title</p>
              <div className="text-lg font-semibold text-gray-900">
                <InlineEdit
                  value={issue.title}
                  onSave={(title) => updateMutation.mutate({ title })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Description</p>
              <div className="text-sm text-gray-700">
                <InlineEdit
                  value={issue.description ?? ""}
                  onSave={(description) => updateMutation.mutate({ description })}
                  multiline
                />
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
                Comments {comments.length > 0 && `(${comments.length})`}
              </p>

              <div className="flex flex-col gap-5 mb-5">
                {commentsLoading ? (
                  <p className="text-sm text-gray-400">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-300 text-center py-4">Chưa có comment nào</p>
                ) : (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      issueId={issueId!}
                      currentUserId={issue.created_by}
                    />
                  ))
                )}
              </div>

              {/* New comment form */}
              <div className="flex flex-col gap-2 border-t pt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết comment..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => { if (newComment.trim()) addCommentMutation.mutate(newComment.trim()); }}
                    disabled={addCommentMutation.isPending || !newComment.trim()}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addCommentMutation.isPending ? "Đang gửi..." : "Gửi"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — metadata */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Properties</p>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <StatusSelect
                    value={issue.status}
                    onChange={(status) => updateMutation.mutate({ status })}
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Priority</p>
                  <PrioritySelect
                    value={issue.priority}
                    onChange={(priority) => updateMutation.mutate({ priority })}
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Created</p>
                  <p className="text-xs text-gray-600">
                    {new Date(issue.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}