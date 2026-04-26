import client from "./client";

export interface Notification {
  id: string;
  type: "assigned" | "commented";
  read: boolean;
  created_at: string;
  issue_id: string;
  issue_title: string;
  project_id: string;
  workspace_id: string;
}

export const listNotifications = () =>
  client.get<Notification[]>("/me/notifications").then((r) => r.data);

export const getUnreadCount = () =>
  client.get<{ count: number }>("/me/notifications/unread-count").then((r) => r.data.count);

export const markNotificationRead = (id: string) =>
  client.patch<Notification>(`/me/notifications/${id}/read`).then((r) => r.data);

export const markAllRead = () =>
  client.patch("/me/notifications/read-all");
