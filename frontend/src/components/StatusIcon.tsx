import type { Issue } from "../api/issues";

export default function StatusIcon({
  status,
  className = "w-3.5 h-3.5",
}: {
  status: Issue["status"];
  className?: string;
}) {
  if (status === "todo") {
    return (
      <svg className={className} viewBox="0 0 14 14" fill="none">
        <circle
          cx="7" cy="7" r="5.5"
          stroke="#6b7280"
          strokeWidth="1.5"
          strokeDasharray="2.5 1.5"
        />
      </svg>
    );
  }

  if (status === "in_progress") {
    return (
      <svg className={className} viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M7 1.5 A5.5 5.5 0 0 1 12.5 7 L7 7 Z" fill="#f59e0b" />
      </svg>
    );
  }

  if (status === "in_review") {
    return (
      <svg className={className} viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="2.5" fill="#8b5cf6" />
      </svg>
    );
  }

  if (status === "done") {
    return (
      <svg className={className} viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="7" fill="#10b981" />
        <path
          d="M4 7.2 L6.2 9.5 L10 5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // cancelled
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="#ef4444" strokeWidth="1.5" />
      <path
        d="M5 5 L9 9 M9 5 L5 9"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
