import { AuthLayout } from "@/features/auth/components/auth_layout";

import { LoginForm } from "@/features/auth/components/login_form";

export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}