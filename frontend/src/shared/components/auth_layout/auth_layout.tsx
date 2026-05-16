import type { ReactNode } from "react";

import "./auth_layout.css";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="auth_layout">
      <section className="auth_layout_content">
        {children}
      </section>
    </main>
  );
}