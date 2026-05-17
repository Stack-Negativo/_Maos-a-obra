import { useState } from "react";

import { loginService } from "@/features/auth/services/auth_service";

import { AuthContext } from "./auth_context";

type User = {
  id: string;
  name: string;
  email: string;
};

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
        return JSON.parse(storedUser) as User;
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

    localStorage.setItem(
      "user",
      JSON.stringify(
        response.user,
      ),
    );

    setToken(response.token);

    setUser(response.user);
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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
