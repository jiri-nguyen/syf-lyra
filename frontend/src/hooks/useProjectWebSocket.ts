import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Issue } from "../api/issues";

type IssueEvent =
  | { type: "issue.created"; project_id: string; data: Issue }
  | { type: "issue.updated"; project_id: string; data: Issue }
  | { type: "issue.deleted"; project_id: string; data: { id: string } };

/**
 * Kết nối WebSocket đến project channel, tự động cập nhật React Query cache
 * khi nhận event từ server — không cần refresh trang.
 *
 * - issue.created → invalidate danh sách (refetch để giữ đúng sort_order)
 * - issue.updated → cập nhật optimistic trực tiếp trong cache
 * - issue.deleted → xóa khỏi cache ngay lập tức
 */
export function useProjectWebSocket(projectId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Dùng window.location để Vite proxy /ws → ws://localhost:8000/ws
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/projects/${projectId}?token=${token}`
    );

    ws.onmessage = (e: MessageEvent) => {
      let event: IssueEvent;
      try {
        event = JSON.parse(e.data);
      } catch {
        return;
      }

      switch (event.type) {
        case "issue.created":
          // Refetch — không thể biết vị trí sort_order chính xác trong cache
          queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
          break;

        case "issue.updated": {
          const updated = event.data;
          // Cập nhật tất cả cached queries của project này (kể cả khi có filters)
          queryClient.setQueriesData<Issue[]>(
            { queryKey: ["issues", projectId] },
            (old) => old?.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
          );
          // Cập nhật cache của issue detail page nếu đang mở
          queryClient.setQueryData(["issue", projectId, updated.id], updated);
          break;
        }

        case "issue.deleted": {
          const { id } = event.data;
          queryClient.setQueriesData<Issue[]>(
            { queryKey: ["issues", projectId] },
            (old) => old?.filter((i) => i.id !== id)
          );
          break;
        }
      }
    };

    ws.onerror = () => {
      // Lỗi kết nối — không làm gì, app vẫn dùng được bình thường
    };

    return () => {
      ws.close();
    };
  }, [projectId, queryClient]);
}
