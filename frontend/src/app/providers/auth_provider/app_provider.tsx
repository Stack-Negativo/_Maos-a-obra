import type {
  ReactNode,
} from "react";

import { AuthProvider } from "./auth_provider";

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({
  children,
}: AppProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}