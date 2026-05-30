import { useState } from "react";

import { loginService } from "@/features/auth/services/auth_service";
import type { User } from "@/features/auth/types/auth_types";
import { UserRole } from "@/features/auth/types/auth_types";
import { isMockMode } from "@/shared/mocks/mock_mode";

import { AuthContext } from "./auth_context";

type AuthProviderProps = {
  children: React.ReactNode;
};

type SignInPayload = {
  email: string;
  password: string;
};

const LEGACY_MOCK_STORAGE_KEYS = [
  "mock_addresses",
  "mock_user",
  "mock_providers",
  "maos_a_obra_mock_orders_v6",
  "maos_a_obra_mock_specialties_v2",
  "maos_a_obra_mock_specialty_requests_v1",
];

function clearLegacyMockStorage() {
  LEGACY_MOCK_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(() => {
      const storedUser =
        localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      clearLegacyMockStorage();

      if (isMockMode() && storedToken && !storedToken.startsWith("mock-token:")) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
      }

      if (!storedUser) {
        return null;
      }

      try {
        const parsedUser =
          JSON.parse(storedUser) as Partial<User>;

        if (
          !parsedUser.id ||
          !parsedUser.email ||
          parsedUser.id.startsWith("mock-") ||
          parsedUser.email.endsWith(".local")
        ) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          return null;
        }

        return {
          id: parsedUser.id,
          name: parsedUser.name ?? parsedUser.email.split("@")[0],
          email: parsedUser.email,
          role: parsedUser.role ?? UserRole.CLIENT,
          providerId: parsedUser.providerId,
          bio: parsedUser.bio,
          isProvider:
            parsedUser.isProvider ?? parsedUser.role === "PROVIDER",
          isAdmin: parsedUser.isAdmin ?? false,
          specialties: parsedUser.specialties ?? [],
        };
      } catch {
        localStorage.removeItem("user");
        return null;
      }
    });

  const [token, setToken] =
    useState<string | null>(() => {
      const storedToken = localStorage.getItem("token");

      if (isMockMode() && storedToken && !storedToken.startsWith("mock-token:")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
      }

      if (storedToken === "mock-token-mvp") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
      }

      return storedToken;
    });

  async function signIn({
    email,
    password,
  }: SignInPayload) {
    const response =
      await loginService({
        email,
        password,
      });

    localStorage.setItem(
      "token",
      response.token,
    );

    const userWithRole: User = {
      ...response.user,
      role:
        response.user.role ??
        (response.user.isAdmin
          ? UserRole.ADMIN
          : response.user.isProvider
            ? UserRole.PROVIDER
            : UserRole.CLIENT),
      isProvider: response.user.isProvider ?? false,
      isAdmin: response.user.isAdmin ?? false,
      specialties: response.user.specialties ?? [],
    };

    updateUser(userWithRole);

    setToken(response.token);
  }

  function updateUser(nextUser: User) {
    localStorage.setItem(
      "user",
      JSON.stringify(nextUser),
    );

    setUser(nextUser);
  }

  function signOut() {
    localStorage.removeItem(
      "token",
    );

    localStorage.removeItem(
      "user",
    );

    setToken(null);

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,

        signIn,
        updateUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
