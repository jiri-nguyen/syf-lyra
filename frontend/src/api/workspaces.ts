import client from "./client";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

export const listWorkspaces = () =>
  client.get<Workspace[]>("/workspaces").then((r) => r.data);
