import { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <Link to="/workspaces" className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
          Linear Clone
        </Link>
        <NotificationBell />
      </header>
      <div className="pt-12">{children}</div>
    </>
  );
}
