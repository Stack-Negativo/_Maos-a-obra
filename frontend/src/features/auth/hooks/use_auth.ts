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

  async function handleLogin() {
    if (
      !email ||
      !password
    ) {
      alert(
        "Preencha email e senha",
      );

      return;
    }

    try {
      setLoading(true);

      await signIn({
        email,
        password,
      });

      navigate("/dashboard");
    } catch {
      alert(
        "Erro ao realizar login",
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    password,
    loading,

    setEmail,
    setPassword,

    handleLogin,
  };
}