import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import "./style.css";
import App from "./App";
import { AppNav } from "./components/layout/app-nav";
import DashboardPage from "./pages/dashboard";

function RootLayout() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-4xl p-4">
        <Outlet />
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<App />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
