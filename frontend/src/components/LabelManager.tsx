import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listLabels, createLabel, deleteLabel, type Label } from "../api/labels";

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280",
];

interface Props {
  workspaceId: string;
}

export default function LabelManager({ workspaceId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState("");

  const { data: labels = [] } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => listLabels(workspaceId),
  });

  const createMutation = useMutation({
    mutationFn: () => createLabel(workspaceId, { name, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels", workspaceId] });
      setName("");
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail ?? "Không thể tạo label");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (labelId: string) => deleteLabel(workspaceId, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["labels", workspaceId] }),
  });

  return (
    <div className="bg-white rounded-xl border p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Labels</h2>

      {/* Create form */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên label..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => { if (name.trim()) createMutation.mutate(); }}
            disabled={createMutation.isPending || !name.trim()}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Tạo
          </button>
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Màu:</span>
          <div className="flex gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {/* Custom color */}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0"
            title="Chọn màu tùy chỉnh"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Label list */}
      <div className="flex flex-col gap-2">
        {labels.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-4">Chưa có label nào</p>
        ) : (
          labels.map((label: Label) => (
            <div key={label.id} className="flex items-center gap-3 py-1.5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: label.color }}
              />
              <span className="text-sm text-gray-700 flex-1">{label.name}</span>
              <span className="text-xs text-gray-300 font-mono">{label.color}</span>
              <button
                onClick={() => deleteMutation.mutate(label.id)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50"
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}