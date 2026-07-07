import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
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
import ContentListPage from "./pages/content/content-list";
import ContentCreatePage from "./pages/content/content-create";
import ContentEditorPage from "./pages/content/content-editor";
import DiagramsListPage from "./pages/diagrams/diagrams-list";
import DiagramCreatePage from "./pages/diagrams/diagram-create";
import DiagramEditorPage from "./pages/diagrams/diagram-editor";
import LibraryPage from "./pages/library/library-page";
import ApiKeysPage from "./pages/api-keys/api-keys-page";
import UsersPage from "./pages/users/users-page";
import CollectionsListPage from "./pages/collections/collections-list";
import CollectionCreatePage from "./pages/collections/collection-create";
import CollectionDetailPage from "./pages/collections/collection-detail";
import CollectionItemsPage from "./pages/collections/collection-items";
import CollectionItemEditorPage from "./pages/collections/collection-item-editor";
import ImageTransformTestPage from "./pages/dev/image-transform-test";

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
                <Route index element={<Navigate to="/content" replace />} />

                <Route path="content" element={<ContentListPage />} />
                <Route path="content/new" element={<ContentCreatePage />} />
                <Route path="content/:id" element={<ContentEditorPage />} />

                <Route path="diagrams" element={<DiagramsListPage />} />
                <Route path="diagrams/new" element={<DiagramCreatePage />} />
                <Route path="diagrams/:id" element={<DiagramEditorPage />} />

                <Route path="library" element={<LibraryPage />} />

                <Route path="collections" element={<CollectionsListPage />} />
                <Route
                  path="collections/new"
                  element={<CollectionCreatePage />}
                />
                <Route
                  path="collections/:id"
                  element={<CollectionDetailPage />}
                />
                <Route
                  path="collections/:id/items"
                  element={<CollectionItemsPage />}
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
