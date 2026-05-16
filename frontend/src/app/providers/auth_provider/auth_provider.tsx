import {
  useEffect,
  useState,
} from "react";

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
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  useEffect(() => {
    const storedToken =
      localStorage.getItem("token");

    const storedUser =
      localStorage.getItem("user");

    if (
      storedToken &&
      storedUser
    ) {
      setToken(storedToken);

      setUser(
        JSON.parse(storedUser),
      );
    }
  }, []);

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