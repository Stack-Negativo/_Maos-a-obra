import { useState } from "react";

import { loginService } from "@/features/auth/services/auth_service";
import type { User } from "@/features/auth/types/auth_types";
import { UserRole } from "@/features/auth/types/auth_types";

import { AuthContext } from "./auth_context";

type AuthProviderProps = {
  children: React.ReactNode;
};

type SignInPayload = {
  email: string;
  password: string;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(() => {
      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      try {
        const parsedUser =
          JSON.parse(storedUser) as Partial<User>;

        return {
          id: parsedUser.id ?? "mock-client",
          name: parsedUser.name ?? "Mariana Cliente",
          email: parsedUser.email ?? "cliente@maosaobra.local",
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
    useState<string | null>(() =>
      localStorage.getItem("token"),
    );

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
