import { NavLink } from "react-router";

const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

const activeClass = "bg-accent text-accent-foreground";

export function AppNav() {
  return (
    <header className="border-b border-border bg-card">
      <nav
        className="mx-auto flex max-w-4xl items-center gap-1 px-4 py-2"
        aria-label="Main"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : ""}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : ""}`
          }
        >
          Dashboard
        </NavLink>
      </nav>
    </header>
  );
}
