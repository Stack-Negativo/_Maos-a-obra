import { Link } from "react-router-dom";

import { AuthLayout } from "@/features/auth/components/auth_layout";
import { LoginForm } from "@/features/auth/components/login_form";

export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
      <div className="auth-layout__footer">
        <p>
          Ainda não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
