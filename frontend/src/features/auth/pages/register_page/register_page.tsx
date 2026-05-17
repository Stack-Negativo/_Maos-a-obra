import { AuthLayout } from "@/features/auth/components/auth_layout";
import { RegisterForm } from "@/features/auth/components/register_form";

export function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
