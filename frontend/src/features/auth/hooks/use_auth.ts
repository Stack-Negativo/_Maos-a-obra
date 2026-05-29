import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider";
import { UserRole } from "../types/auth_types";

export function useAuth() {
  const navigate = useNavigate();

  const { signIn } =
    useAuthContext();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleLogin(
    credentials?: {
      email: string;
      password: string;
    },
  ) {
    const nextEmail =
      credentials?.email ?? email;
    const nextPassword =
      credentials?.password ?? password;

    const validationError =
      validateLoginCredentials(nextEmail, nextPassword);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await signIn({
        email: nextEmail.trim(),
        password: nextPassword,
      });

      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser
        ? (JSON.parse(storedUser) as { role?: UserRole })
        : null;

      if (parsedUser?.role === UserRole.ADMIN) {
        navigate("/orders/admin");
        return;
      }

      if (parsedUser?.role === UserRole.PROVIDER) {
        navigate("/orders/provider");
        return;
      }

      navigate("/orders/client");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao realizar login.",
      );
    } finally {
      setLoading(false);
    }
  }

  function validateLoginCredentials(
    loginEmail: string,
    loginPassword: string,
  ) {
    if (
      !loginEmail.trim() ||
      !loginPassword.trim()
    ) {
      return "Preencha email e senha.";
    }

    if (!loginEmail.includes("@")) {
      return "Informe um email válido.";
    }

    return null;
  }

  return {
    email,
    password,
    loading,
    error,

    setEmail,
    setPassword,

    handleLogin,
  };
}
