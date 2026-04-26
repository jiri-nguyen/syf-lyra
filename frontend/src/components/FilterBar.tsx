import type { Issue } from "../api/issues";
import type { Label } from "../api/labels";
import type { IssueFilters } from "../hooks/useIssueFilter";

const STATUSES: { value: Issue["status"]; label: string; color: string }[] = [
  { value: "todo", label: "Todo", color: "bg-gray-100 text-gray-600 border-gray-200" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "in_review", label: "In Review", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "done", label: "Done", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-600 border-red-200" },
];

const PRIORITIES: { value: Issue["priority"]; label: string; color: string }[] = [
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-600 border-red-200" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-600 border-orange-200" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-600 border-yellow-200" },
  { value: "low", label: "Low", color: "bg-blue-100 text-blue-500 border-blue-200" },
  { value: "no_priority", label: "No Priority", color: "bg-gray-100 text-gray-400 border-gray-200" },
];

interface Props {
  filters: IssueFilters;
  onToggleStatus: (value: Issue["status"]) => void;
  onTogglePriority: (value: Issue["priority"]) => void;
  onToggleLabel: (id: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  labels?: Label[];
}

export default function FilterBar({
  filters,
  onToggleStatus,
  onTogglePriority,
  onToggleLabel,
  onReset,
  hasActiveFilters,
  labels = [],
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-3 border-b border-gray-100">

      {/* Status filters */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 font-medium mr-1">Status</span>
        {STATUSES.map(({ value, label, color }) => {
          const active = filters.status.includes(value);
          return (
            <button
              key={value}
              onClick={() => onToggleStatus(value)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                active
                  ? `${color} ring-2 ring-offset-1 ring-current`
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="w-px h-5 bg-gray-200" />

      {/* Priority filters */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 font-medium mr-1">Priority</span>
        {PRIORITIES.map(({ value, label, color }) => {
          const active = filters.priority.includes(value);
          return (
            <button
              key={value}
              onClick={() => onTogglePriority(value)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                active
                  ? `${color} ring-2 ring-offset-1 ring-current`
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Label filters */}
      {labels.length > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-medium mr-1">Label</span>
            {labels.map((label) => {
              const active = filters.label_ids.includes(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => onToggleLabel(label.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    active
                      ? "ring-2 ring-offset-1"
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    active
                      ? { backgroundColor: label.color + "22", color: label.color, borderColor: label.color }
                      : {}
                  }
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <>
          <div className="w-px h-5 bg-gray-200" />
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <span>✕</span> Clear filters
          </button>
        </>
      )}
    </div>
  );
}