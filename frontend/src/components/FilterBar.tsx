import { useState, useRef, useEffect } from "react";
import type { Issue } from "../api/issues";
import type { Label } from "../api/labels";
import type { IssueFilters } from "../hooks/useIssueFilter";
import StatusIcon from "./StatusIcon";
import PriorityIcon from "./PriorityIcon";

// ── Icons ──────────────────────────────────────────────────────────────────

const CircleIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0">
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const BarsIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <rect x="1" y="8" width="3" height="6" rx="1" opacity="0.5" />
    <rect x="6" y="5" width="3" height="9" rx="1" opacity="0.7" />
    <rect x="11" y="2" width="3" height="12" rx="1" />
  </svg>
);

const TagIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
  </svg>
);

// ── FilterDropdown ─────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  icon,
  activeCount,
  onClear,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  activeCount: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isActive = activeCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors"
        style={{
          border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
          color: isActive ? "var(--accent)" : "var(--text-secondary)",
          backgroundColor: isActive ? "rgba(94,106,210,0.08)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "var(--content-alt)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        {icon}
        <span>{label}</span>
        {isActive && (
          <span
            className="text-[9px] font-bold text-white rounded-full flex items-center justify-center leading-none"
            style={{
              backgroundColor: "var(--accent)",
              minWidth: "14px",
              height: "14px",
              padding: "0 3px",
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-lg py-1 z-50"
          style={{
            minWidth: "176px",
            backgroundColor: "var(--content-bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {isActive && (
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
              style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-subtle)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              <XIcon /> Clear filter
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// ── Option row ─────────────────────────────────────────────────────────────

function OptionRow({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors"
      style={{ color: "var(--text-primary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--content-alt)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
    >
      {icon}
      <span className="flex-1 text-xs">{label}</span>
      {active && (
        <span className="text-xs" style={{ color: "var(--accent)" }}>✓</span>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const STATUSES: { value: Issue["status"]; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITIES: { value: Issue["priority"]; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "no_priority", label: "No priority" },
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
    <div className="flex items-center gap-2">
      {/* Status */}
      <FilterDropdown
        label="Status"
        icon={<CircleIcon />}
        activeCount={filters.status.length}
        onClear={() => filters.status.forEach((s) => onToggleStatus(s))}
      >
        {STATUSES.map(({ value, label }) => (
          <OptionRow
            key={value}
            icon={<StatusIcon status={value} className="w-3.5 h-3.5 shrink-0" />}
            label={label}
            active={filters.status.includes(value)}
            onClick={() => onToggleStatus(value)}
          />
        ))}
      </FilterDropdown>

      {/* Priority */}
      <FilterDropdown
        label="Priority"
        icon={<BarsIcon />}
        activeCount={filters.priority.length}
        onClear={() => filters.priority.forEach((p) => onTogglePriority(p))}
      >
        {PRIORITIES.map(({ value, label }) => (
          <OptionRow
            key={value}
            icon={<PriorityIcon priority={value} className="w-3.5 h-3.5 shrink-0" />}
            label={label}
            active={filters.priority.includes(value)}
            onClick={() => onTogglePriority(value)}
          />
        ))}
      </FilterDropdown>

      {/* Label */}
      {labels.length > 0 && (
        <FilterDropdown
          label="Label"
          icon={<TagIcon />}
          activeCount={filters.label_ids.length}
          onClear={() => filters.label_ids.forEach((id) => onToggleLabel(id))}
        >
          {labels.map((label) => (
            <OptionRow
              key={label.id}
              icon={
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
              }
              label={label.name}
              active={filters.label_ids.includes(label.id)}
              onClick={() => onToggleLabel(label.id)}
            />
          ))}
        </FilterDropdown>
      )}

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
        >
          <XIcon /> Clear
        </button>
      )}
    </div>
  );
}
