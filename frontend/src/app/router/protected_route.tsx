import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider/use_auth_context";
import { UserRole } from "@/features/auth/types/auth_types";

type ProtectedRouteProps = {
  children: ReactNode;
  roles?: UserRole[];
};

export function ProtectedRoute({
  children,
  roles,
}: ProtectedRouteProps) {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const effectiveRole = user.isAdmin
    ? UserRole.ADMIN
    : user.isProvider
      ? UserRole.PROVIDER
      : user.role;

  if (roles && !roles.includes(effectiveRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
