import client from "./client";

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  identifier: string;
  created_at: string;
}

export const listProjects = (workspaceId: string) =>
  client.get<Project[]>(`/workspaces/${workspaceId}/projects`).then((r) => r.data);
