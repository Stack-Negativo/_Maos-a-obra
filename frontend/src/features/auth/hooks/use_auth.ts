import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider";

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

  function validateLogin() {
    if (
      !email.trim() ||
      !password.trim()
    ) {
      return "Preencha email e senha.";
    }

    if (!email.includes("@")) {
      return "Informe um email valido.";
    }

    return null;
  }

  async function handleLogin() {
    const validationError =
      validateLogin();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await signIn({
        email: email.trim(),
        password,
      });

      navigate("/dashboard");
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
