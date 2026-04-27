import client from "./client";

export interface GitPullRequest {
  id: string;
  pr_number: number;
  title: string;
  url: string;
  state: "open" | "closed" | "merged";
  branch_name: string;
  author_login: string | null;
  author_avatar: string | null;
  merged_at: string | null;
  created_at: string;
}

export interface GitCommit {
  id: string;
  sha: string;
  short_sha: string;
  message: string;
  url: string;
  author_name: string | null;
  author_avatar: string | null;
  committed_at: string | null;
  created_at: string;
}

export const listIssuePullRequests = (issueId: string) =>
  client.get<GitPullRequest[]>(`/issues/${issueId}/git/pull-requests`).then((r) => r.data);

export const listIssueCommits = (issueId: string) =>
  client.get<GitCommit[]>(`/issues/${issueId}/git/commits`).then((r) => r.data);
