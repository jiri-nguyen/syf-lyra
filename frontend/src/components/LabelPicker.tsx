import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listLabels,
  getIssueLabels,
  addLabelToIssue,
  removeLabelFromIssue,
  type Label,
} from "../api/labels";

interface Props {
  issueId: string;
  workspaceId: string;
}

function LabelBadge({ label, onRemove }: { label: Label; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: label.color + "22", color: label.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: label.color }}
      />
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 hover:opacity-70"
        >
          ✕
        </button>
      )}
    </span>
  );
}

export default function LabelPicker({ issueId, workspaceId }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: allLabels = [] } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => listLabels(workspaceId),
  });

  const { data: issueLabels = [] } = useQuery({
    queryKey: ["issue-labels", issueId],
    queryFn: () => getIssueLabels(issueId),
  });

  const addMutation = useMutation({
    mutationFn: (labelId: string) => addLabelToIssue(issueId, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issue-labels", issueId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (labelId: string) => removeLabelFromIssue(issueId, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issue-labels", issueId] }),
  });

  const isAssigned = (labelId: string) => issueLabels.some((l) => l.id === labelId);

  const toggle = (label: Label) => {
    if (isAssigned(label.id)) {
      removeMutation.mutate(label.id);
    } else {
      addMutation.mutate(label.id);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Current labels + trigger */}
      <div
        onClick={() => setOpen((v) => !v)}
        className="flex flex-wrap gap-1 cursor-pointer min-h-6"
      >
        {issueLabels.length === 0 ? (
          <span className="text-xs text-gray-300 hover:text-gray-400">+ Add label</span>
        ) : (
          issueLabels.map((label) => (
            <LabelBadge
              key={label.id}
              label={label}
              onRemove={() => removeMutation.mutate(label.id)}
            />
          ))
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg border shadow-lg z-50 py-1">
          {allLabels.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">
              Chưa có label — tạo label trong Settings workspace
            </p>
          ) : (
            allLabels.map((label) => (
              <button
                key={label.id}
                onClick={() => toggle(label)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-sm text-gray-700 flex-1">{label.name}</span>
                {isAssigned(label.id) && (
                  <span className="text-blue-500 text-xs">✓</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export { LabelBadge };