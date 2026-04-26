import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden" style={{ backgroundColor: "var(--content-bg)" }}>
        {/* Top bar */}
        <div
          className="h-10 flex items-center justify-end px-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <NotificationBell />
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
