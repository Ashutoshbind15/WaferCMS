import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import "./style.css";
import "@scribblesvg/react-utils/editor.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";

import ContentListPage from "./pages/content/content-list";
import ContentCreatePage from "./pages/content/content-create";
import ContentEditorPage from "./pages/content/content-editor";
import DiagramsListPage from "./pages/diagrams/diagrams-list";
import DiagramCreatePage from "./pages/diagrams/diagram-create";
import DiagramEditorPage from "./pages/diagrams/diagram-editor";
import LibraryPage from "./pages/library/library-page";
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
  <BrowserRouter>
    <TooltipProvider>
      <SidebarProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Navigate to="/content" replace />} />

            <Route path="content" element={<ContentListPage />} />
            <Route path="content/new" element={<ContentCreatePage />} />
            <Route path="content/:id" element={<ContentEditorPage />} />

            <Route path="diagrams" element={<DiagramsListPage />} />
            <Route path="diagrams/new" element={<DiagramCreatePage />} />
            <Route path="diagrams/:id" element={<DiagramEditorPage />} />

            <Route path="library" element={<LibraryPage />} />
          </Route>
        </Routes>
      </SidebarProvider>
    </TooltipProvider>
  </BrowserRouter>,
);
