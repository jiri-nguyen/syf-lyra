import client from "./client";

export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
}

// workspace labels
export const listLabels = (workspaceId: string) =>
  client.get<Label[]>(`/workspaces/${workspaceId}/labels`).then((r) => r.data);

export const createLabel = (workspaceId: string, data: { name: string; color: string }) =>
  client.post<Label>(`/workspaces/${workspaceId}/labels`, data).then((r) => r.data);

export const deleteLabel = (workspaceId: string, labelId: string) =>
  client.delete(`/workspaces/${workspaceId}/labels/${labelId}`);

// issue labels
export const getIssueLabels = (issueId: string) =>
  client.get<Label[]>(`/issues/${issueId}/labels`).then((r) => r.data);

export const addLabelToIssue = (issueId: string, labelId: string) =>
  client.post(`/issues/${issueId}/labels/${labelId}`);

export const removeLabelFromIssue = (issueId: string, labelId: string) =>
  client.delete(`/issues/${issueId}/labels/${labelId}`);