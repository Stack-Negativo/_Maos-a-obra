import { useEffect } from "react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider/use_auth_context";
import { UserRole } from "@/features/auth/types/auth_types";

import "./app_shell.css";

type AppShellProps = {
  children: ReactNode;
};

const roleOrderRoutes = {
  CLIENT: "/orders/client",
  PROVIDER: "/orders/provider",
  ADMIN: "/orders/admin",
};

const roleHomeRoutes = {
  CLIENT: "/orders/client",
  PROVIDER: "/orders/provider",
  ADMIN: "/orders/admin",
};

const roleLabels = {
  [UserRole.CLIENT]: "Cliente",
  [UserRole.PROVIDER]: "Prestador",
  [UserRole.ADMIN]: "Admin",
};

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

export function AppShell({ children }: AppShellProps) {
  const { user, signOut } = useAuthContext();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme === "dark" || storedTheme === "light") {
      document.documentElement.dataset.theme = storedTheme;
      return;
    }

    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("theme", "dark");
  }, []);

  const effectiveRole = user?.isAdmin
    ? UserRole.ADMIN
    : user?.isProvider
      ? UserRole.PROVIDER
      : user?.role;
  const orderRoute = effectiveRole ? roleOrderRoutes[effectiveRole] : "/orders";
  const homeRoute = effectiveRole ? roleHomeRoutes[effectiveRole] : "/dashboard";

  const visibleNavItems =
    effectiveRole === UserRole.ADMIN
      ? [
          { label: "Administração", to: orderRoute },
          { label: "Catálogo", to: "/specialties" },
          { label: "Prestadores", to: "/providers" },
          { label: "Perfil", to: "/profile" },
        ]
      : effectiveRole === UserRole.PROVIDER
        ? [
            { label: "Ordens", to: orderRoute },
            { label: "Especialidades", to: "/specialties" },
            { label: "Perfil", to: "/profile" },
          ]
        : [
            { label: "Endereços", to: "/addresses" },
            { label: "Minhas Ordens", to: orderRoute },
            { label: "Perfil", to: "/profile" },
          ];

  return (
    <div
      className={`app-shell app-shell--${
        effectiveRole?.toLowerCase() ?? "guest"
      }`}
    >
      <header className="app-shell__topbar">
        <Link to={homeRoute} className="app-shell__brand">
          <span className="app-shell__brand-icon" aria-hidden="true">
            MO
          </span>
          <span>Mãos à Obra</span>
        </Link>

        <nav className="app-shell__nav" aria-label="Navegação principal">
          {visibleNavItems.map((item) => (
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
          <span className="app-shell__avatar">{getInitials(user?.name)}</span>
          <div className="app-shell__user-copy">
            <strong>{user?.name ?? "Usuário MVP"}</strong>
            <span>
              {user?.role ?? "CLIENT"} - {user?.email ?? "mock@local"}
            </span>
          </div>
          <div className="app-shell__role-badge" aria-label="Perfil do usuário">
            {effectiveRole ? roleLabels[effectiveRole] : "Cliente"}
          </div>
          <button
            type="button"
            className="app-shell__theme-toggle"
            onClick={() => {
              const currentTheme = document.documentElement.dataset.theme;
              const nextTheme = currentTheme === "dark" ? "light" : "dark";

              document.documentElement.dataset.theme = nextTheme;
              localStorage.setItem("theme", nextTheme);
            }}
          >
            Tema
          </button>
          <button type="button" onClick={signOut}>
            Sair
          </button>
        </div>
      </header>

      <main className="app-shell__content">{children}</main>
    </div>
  );
}
