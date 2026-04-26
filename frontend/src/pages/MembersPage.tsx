import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LabelManager from "../components/LabelManager";
import {
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  type Member,
} from "../api/members";

function Avatar({ member }: { member: Member }) {
  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={member.full_name}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
      {member.full_name.charAt(0).toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }: { role: Member["role"] }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        role === "admin"
          ? "bg-purple-100 text-purple-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {role}
    </span>
  );
}

export default function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => listMembers(workspaceId!),
    enabled: !!workspaceId,
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => inviteMember(workspaceId!, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
      setEmail("");
      setInviteError("");
    },
    onError: (err: any) => {
      setInviteError(err.response?.data?.detail ?? "Không thể mời thành viên");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Member["role"] }) =>
      updateMemberRole(workspaceId!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(workspaceId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate(email.trim());
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-8">Members</h1>

        {/* Invite form */}
        <div className="bg-white rounded-xl border p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Mời thành viên
          </h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setInviteError("");
              }}
              placeholder="email@example.com"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {inviteMutation.isPending ? "Đang mời..." : "Mời"}
            </button>
          </form>
          {inviteError && (
            <p className="text-xs text-red-500 mt-2">{inviteError}</p>
          )}
        </div>

        {/* Member list */}
        <div className="bg-white rounded-xl border divide-y">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <Avatar member={member} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {member.full_name}
                </p>
                <p className="text-xs text-gray-400 truncate">{member.email}</p>
              </div>

              <RoleBadge role={member.role} />

              {/* Role toggle */}
              <select
                value={member.role}
                onChange={(e) =>
                  updateRoleMutation.mutate({
                    userId: member.user_id,
                    role: e.target.value as Member["role"],
                  })
                }
                className="text-xs border rounded px-2 py-1 text-gray-600 bg-gray-50"
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>

              {/* Remove button */}
              <button
                onClick={() => {
                  if (confirm(`Xóa ${member.full_name} khỏi workspace?`)) {
                    removeMutation.mutate(member.user_id);
                  }
                }}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                Xóa
              </button>
            </div>
          ))}

          {members.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Chưa có thành viên nào.
            </p>
          )}
        </div>
        <LabelManager workspaceId={workspaceId!} />
      </div>
    </div>
  );
}