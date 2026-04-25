import client from "./client";

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar: string | null;
}

export const listComments = (issueId: string) =>
  client.get<Comment[]>(`/issues/${issueId}/comments`).then((r) => r.data);

export const createComment = (issueId: string, content: string) =>
  client
    .post<Comment>(`/issues/${issueId}/comments`, { content })
    .then((r) => r.data);

export const updateComment = (issueId: string, commentId: string, content: string) =>
  client
    .patch<Comment>(`/issues/${issueId}/comments/${commentId}`, { content })
    .then((r) => r.data);

export const deleteComment = (issueId: string, commentId: string) =>
  client.delete(`/issues/${issueId}/comments/${commentId}`);