import type { ReactNode } from "react";

import "./auth_layout.css";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <section className="auth-layout__content">
        <div className="auth-layout__brand">
          <strong>Mãos à Obra</strong>
          <p>Acesse com usuarios cadastrados no backend.</p>
        </div>

        {children}
      </section>
    </main>
  );
}
