import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listIssues, createIssue, updateIssue, type Issue } from "../api/issues";

// TODO: lấy từ URL params sau — tạm hardcode để test
const PROJECT_ID = "f1555021-390c-4a40-866f-17a4b39a6eb4";

const STATUS_LABELS: Record<Issue["status"], string> = {
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

const PRIORITY_COLORS: Record<Issue["priority"], string> = {
  no_priority: "text-gray-400",
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-blue-400",
};

export default function IssuesPage() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: issues = [], isLoading, isError } = useQuery({
    queryKey: ["issues", PROJECT_ID],
    queryFn: () => listIssues(PROJECT_ID),
  });

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      createIssue(PROJECT_ID, { title, status: "todo", priority: "no_priority" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", PROJECT_ID] });
      setNewTitle("");
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: Issue["status"] }) =>
      updateIssue(PROJECT_ID, issueId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", PROJECT_ID] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate(newTitle.trim());
  };

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
      <div className="max-w-4xl mx-auto py-10 px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Issues</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Issue
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="mb-4 flex gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tên issue..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-100"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Issue list */}
        {issues.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">
            Chưa có issue nào — tạo issue đầu tiên đi!
          </p>
        ) : (
          <div className="bg-white rounded-xl border divide-y">
            {issues.map((issue) => (
              <div key={issue.id} className="flex items-center gap-4 px-4 py-3">

                {/* Status dropdown */}
                <select
                  value={issue.status}
                  onChange={(e) =>
                    updateMutation.mutate({
                      issueId: issue.id,
                      status: e.target.value as Issue["status"],
                    })
                  }
                  className="text-xs border rounded px-2 py-1 text-gray-600 bg-gray-50"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                {/* Title */}
                <span className={`flex-1 text-sm ${issue.status === "done" || issue.status === "cancelled" ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {issue.title}
                </span>

                {/* Priority */}
                <span className={`text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                  {issue.priority.replace("_", " ")}
                </span>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}