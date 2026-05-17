import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider/use_auth_context";

import "./app_shell.css";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  {
    label: "Inicio",
    to: "/dashboard",
  },
  {
    label: "Especialidades",
    to: "/specialties",
  },
  {
    label: "Enderecos",
    to: "/addresses",
  },
];

function getInitials(name?: string) {
  if (!name) {
    return "MO";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({
  children,
}: AppShellProps) {
  const { user, signOut } = useAuthContext();

  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <Link to="/dashboard" className="app-shell__brand">
          <span className="app-shell__brand-icon" aria-hidden="true">
            MO
          </span>
          <span>Maos a Obra</span>
        </Link>

        <nav className="app-shell__nav" aria-label="Navegacao principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? "app-shell__nav-link app-shell__nav-link--active"
                  : "app-shell__nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__user">
          <span className="app-shell__avatar">
            {getInitials(user?.name)}
          </span>
          <div className="app-shell__user-copy">
            <strong>{user?.name ?? "Usuario MVP"}</strong>
            <span>{user?.email ?? "mock@local"}</span>
          </div>
          <button type="button" onClick={signOut}>
            Sair
          </button>
        </div>
      </header>

      <main className="app-shell__content">{children}</main>
    </div>
  );
}
