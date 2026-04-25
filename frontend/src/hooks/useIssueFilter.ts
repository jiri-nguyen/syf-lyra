import { useState, useCallback } from "react";
import type { Issue } from "../api/issues";

export interface IssueFilters {
  status: Issue["status"][];
  priority: Issue["priority"][];
  assignee_id: string | null;
}

const EMPTY_FILTERS: IssueFilters = {
  status: [],
  priority: [],
  assignee_id: null,
};

export function useIssueFilter() {
  const [filters, setFilters] = useState<IssueFilters>(EMPTY_FILTERS);

  const toggleStatus = useCallback((value: Issue["status"]) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(value)
        ? prev.status.filter((s) => s !== value)
        : [...prev.status, value],
    }));
  }, []);

  const togglePriority = useCallback((value: Issue["priority"]) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority.includes(value)
        ? prev.priority.filter((p) => p !== value)
        : [...prev.priority, value],
    }));
  }, []);

  const setAssignee = useCallback((id: string | null) => {
    setFilters((prev) => ({ ...prev, assignee_id: id }));
  }, []);

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.assignee_id !== null;

  // build query params để truyền vào API
  const toQueryParams = () => {
    const params = new URLSearchParams();
    filters.status.forEach((s) => params.append("status", s));
    filters.priority.forEach((p) => params.append("priority", p));
    if (filters.assignee_id) params.set("assignee_id", filters.assignee_id);
    return params;
  };

  return {
    filters,
    toggleStatus,
    togglePriority,
    setAssignee,
    reset,
    hasActiveFilters,
    toQueryParams,
  };
}