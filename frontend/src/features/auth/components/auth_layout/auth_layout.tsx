import { useEffect } from "react";
import type { ReactNode } from "react";

import { initializeTheme } from "@/shared/utils/theme";

import "./auth_layout.css";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <main className="auth-layout">
      <section className="auth-layout__content">
        <div className="auth-layout__brand">
          <strong>Mãos à Obra</strong>
          <p>Organize serviços residenciais com acompanhamento de ponta a ponta.</p>
        </div>

        {children}
      </section>
    </main>
  );
}
