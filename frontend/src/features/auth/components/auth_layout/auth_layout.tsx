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
          <strong>Maos a Obra</strong>
          <p>Teste login, cadastro e especialidades no painel do MVP.</p>
        </div>

        {children}
      </section>
    </main>
  );
}
