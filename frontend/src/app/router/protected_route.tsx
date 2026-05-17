import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider/use_auth_context";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
