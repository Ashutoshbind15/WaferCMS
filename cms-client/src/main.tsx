import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from "react-router";
import "./style.css";
import "@scribblesvg/react-utils/editor.css";

import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/context/auth-context";
import { RequireAuth } from "@/components/auth/require-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";

import LoginPage from "./pages/login/login-page";
import LibraryPage from "./pages/library/library-page";
import ApiKeysPage from "./pages/api-keys/api-keys-page";
import UsersPage from "./pages/users/users-page";
import CollectionsListPage from "./pages/collections/collections-list";
import CollectionDetailPage from "./pages/collections/collection-detail";
import CollectionItemEditorPage from "./pages/collections/collection-item-editor";
import ImageTransformTestPage from "./pages/dev/image-transform-test";
import AiTaskPage from "./pages/ai/ai-task-page";
import { aiAgentEnabled } from "@/lib/features";

function RootLayout() {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
      <Toaster />
    </>
  );
}

function CollectionItemsRedirect() {
  const { id } = useParams();
  return (
    <Navigate to={`/collections/${id}`} state={{ tab: "items" }} replace />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <QueryProvider>
    <BrowserRouter>
      <AuthProvider>
      <TooltipProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<RootLayout />}>
                <Route index element={<Navigate to="/collections" replace />} />

                <Route path="library" element={<LibraryPage />} />

                <Route path="collections" element={<CollectionsListPage />} />
                <Route
                  path="collections/:id"
                  element={<CollectionDetailPage />}
                />
                <Route
                  path="collections/:id/items"
                  element={<CollectionItemsRedirect />}
                />
                <Route
                  path="collections/:id/items/new"
                  element={<CollectionItemEditorPage />}
                />
                <Route
                  path="collections/:id/items/:itemId"
                  element={<CollectionItemEditorPage />}
                />

                <Route path="api-keys" element={<ApiKeysPage />} />
                <Route path="users" element={<UsersPage />} />
                {aiAgentEnabled ? (
                  <Route path="ai" element={<AiTaskPage />} />
                ) : null}
                <Route
                  path="dev/image-transforms"
                  element={<ImageTransformTestPage />}
                />
              </Route>
            </Route>
          </Routes>
        </SidebarProvider>
      </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
    </QueryProvider>
  </ThemeProvider>,
);
