import client from "./client";

export interface Member {
  user_id: string;
  workspace_id: string;
  role: "admin" | "member";
  joined_at: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

export const listMembers = (workspaceId: string) =>
  client.get<Member[]>(`/workspaces/${workspaceId}/members`).then((r) => r.data);

export const inviteMember = (workspaceId: string, email: string) =>
  client
    .post<Member>(`/workspaces/${workspaceId}/members`, { email })
    .then((r) => r.data);

export const updateMemberRole = (
  workspaceId: string,
  userId: string,
  role: "admin" | "member"
) =>
  client
    .patch<Member>(`/workspaces/${workspaceId}/members/${userId}`, { role })
    .then((r) => r.data);

export const removeMember = (workspaceId: string, userId: string) =>
  client.delete(`/workspaces/${workspaceId}/members/${userId}`);