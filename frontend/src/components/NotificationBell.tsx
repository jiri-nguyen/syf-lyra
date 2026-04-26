import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  type Notification,
} from "../api/notifications";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "assigned") {
    return (
      <svg
        className="w-4 h-4 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        style={{ color: "var(--accent)" }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg
      className="w-4 h-4 shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      style={{ color: "#8b5cf6" }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (n: Notification) => void }) {
  const label = notif.type === "assigned" ? "Assigned to you" : "New comment on";

  return (
    <button
      onClick={() => onRead(notif)}
      className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors"
      style={{
        backgroundColor: notif.read ? "transparent" : "rgba(94,106,210,0.05)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = notif.read ? "transparent" : "rgba(94,106,210,0.05)")
      }
    >
      <span
        className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: notif.read ? "transparent" : "var(--accent)" }}
      />
      <NotifIcon type={notif.type} />
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {notif.issue_title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          {timeAgo(notif.created_at)}
        </p>
      </div>
    </button>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: listNotifications,
    enabled: false,
  });

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) markReadMutation.mutate(notif.id);
    setOpen(false);
    navigate(`/workspaces/${notif.workspace_id}/projects/${notif.project_id}/issues/${notif.issue_id}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-md transition-colors"
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--content-alt)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
        }}
        aria-label="Notifications"
      >
        <svg className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
            style={{
              backgroundColor: "var(--accent)",
              minWidth: "14px",
              height: "14px",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl z-50 overflow-hidden"
          style={{
            backgroundColor: "var(--content-bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-xs transition-colors disabled:opacity-50"
                style={{ color: "var(--accent)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            className="max-h-96 overflow-y-auto"
            style={{ borderBottom: notifications.length > 0 ? "none" : undefined }}
          >
            {notifications.length === 0 ? (
              <p
                className="text-sm text-center py-10"
                style={{ color: "var(--text-tertiary)" }}
              >
                No notifications
              </p>
            ) : (
              <div style={{ borderTop: "none" }}>
                {notifications.map((notif, i) => (
                  <div
                    key={notif.id}
                    style={{ borderBottom: i < notifications.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                  >
                    <NotifItem notif={notif} onRead={handleNotifClick} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
