import client from "./client";

export interface Issue {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "in_review" | "done" | "cancelled";
  priority: "no_priority" | "urgent" | "high" | "medium" | "low";
  assignee_id: string | null;
  sort_order: number;
  due_date: string | null;
  created_at: string;
}

export interface IssueCreate {
  title: string;
  status?: Issue["status"];
  priority?: Issue["priority"];
}

export const listIssues = (
  projectId: string,
  params?: URLSearchParams
) => {
  const query = params?.toString();
  const url = `/projects/${projectId}/issues${query ? `?${query}` : ""}`;
  return client.get<Issue[]>(url).then((r) => r.data);
};

export const createIssue = (projectId: string, data: IssueCreate) =>
  client.post<Issue>(`/projects/${projectId}/issues`, data).then((r) => r.data);

export const updateIssue = (
  projectId: string,
  issueId: string,
  data: Partial<IssueCreate>
) =>
  client
    .patch<Issue>(`/projects/${projectId}/issues/${issueId}`, data)
    .then((r) => r.data);

export const deleteIssue = (projectId: string, issueId: string) =>
  client.delete(`/projects/${projectId}/issues/${issueId}`);