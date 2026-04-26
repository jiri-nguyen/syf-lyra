import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "./pages/LoginPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import ProjectsPage from "./pages/ProjectsPage";
import KanbanPage from "./pages/KanbanPage";
import IssueDetailPage from "./pages/IssueDetailPage";
import IssuesPage from "./pages/IssuesPage";
import MembersPage from "./pages/MembersPage";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import CommandPalette from "./components/CommandPalette";
import { CommandPaletteProvider } from "./contexts/CommandPaletteContext";

const queryClient = new QueryClient();

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CommandPaletteProvider>
          <CommandPalette />
          <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Workspaces */}
          <Route path="/workspaces" element={<Protected><WorkspacesPage /></Protected>} />

          {/* Projects */}
          <Route path="/workspaces/:workspaceId/projects" element={<Protected><ProjectsPage /></Protected>} />

          {/* Board */}
          <Route path="/workspaces/:workspaceId/projects/:projectId/board" element={<Protected><KanbanPage /></Protected>} />

          {/* Issue list */}
          <Route path="/workspaces/:workspaceId/projects/:projectId/issues" element={<Protected><IssuesPage /></Protected>} />

          {/* Issue detail */}
          <Route path="/workspaces/:workspaceId/projects/:projectId/issues/:issueId" element={<Protected><IssueDetailPage /></Protected>} />

          {/* Members & settings */}
          <Route path="/workspaces/:workspaceId/members" element={<Protected><MembersPage /></Protected>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/workspaces" replace />} />
        </Routes>
        </CommandPaletteProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
