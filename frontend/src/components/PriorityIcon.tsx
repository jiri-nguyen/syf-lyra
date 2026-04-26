import type { Issue } from "../api/issues";

export default function PriorityIcon({
  priority,
  className = "w-3.5 h-3.5",
}: {
  priority: Issue["priority"];
  className?: string;
}) {
  if (priority === "urgent") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="#ef4444">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
      </svg>
    );
  }

  if (priority === "high") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="8" width="3" height="6" rx="1" fill="#f97316" />
        <rect x="6" y="5" width="3" height="9" rx="1" fill="#f97316" />
        <rect x="11" y="2" width="3" height="12" rx="1" fill="#f97316" />
      </svg>
    );
  }

  if (priority === "medium") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="8" width="3" height="6" rx="1" fill="#eab308" />
        <rect x="6" y="5" width="3" height="9" rx="1" fill="#eab308" />
        <rect x="11" y="2" width="3" height="12" rx="1" fill="#eab308" opacity="0.3" />
      </svg>
    );
  }

  if (priority === "low") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="8" width="3" height="6" rx="1" fill="#3b82f6" />
        <rect x="6" y="5" width="3" height="9" rx="1" fill="#3b82f6" opacity="0.3" />
        <rect x="11" y="2" width="3" height="12" rx="1" fill="#3b82f6" opacity="0.3" />
      </svg>
    );
  }

  // no_priority
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="8" width="3" height="6" rx="1" fill="#a1a1aa" opacity="0.4" />
      <rect x="6" y="5" width="3" height="9" rx="1" fill="#a1a1aa" opacity="0.4" />
      <rect x="11" y="2" width="3" height="12" rx="1" fill="#a1a1aa" opacity="0.4" />
    </svg>
  );
}
