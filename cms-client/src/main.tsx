import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import "./style.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

import ContentListPage from "./pages/content/content-list";
import ContentEditorPage from "./pages/content/content-editor";
import DiagramsListPage from "./pages/diagrams/diagrams-list";
import DiagramEditorPage from "./pages/diagrams/diagram-editor";
import LibraryPage from "./pages/library/library-page";
import BlogsListPage from "./pages/blogs/blogs-list";
import BlogEditorPage from "./pages/blogs/blog-editor";

function RootLayout() {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <SidebarProvider>
          <Routes>
            <Route element={<RootLayout />}>
              <Route index element={<Navigate to="/content" replace />} />

              <Route path="content" element={<ContentListPage />} />
              <Route path="content/new" element={<ContentEditorPage />} />
              <Route path="content/:id" element={<ContentEditorPage />} />

              <Route path="diagrams" element={<DiagramsListPage />} />
              <Route path="diagrams/:id" element={<DiagramEditorPage />} />

              <Route path="library" element={<LibraryPage />} />

              <Route path="blogs" element={<BlogsListPage />} />
              <Route path="blogs/new" element={<BlogEditorPage />} />
              <Route path="blogs/:id" element={<BlogEditorPage />} />
            </Route>
          </Routes>
        </SidebarProvider>
      </TooltipProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
