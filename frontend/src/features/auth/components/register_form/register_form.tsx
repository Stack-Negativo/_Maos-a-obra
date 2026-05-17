import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider/use_auth_context";
import { registerService } from "@/features/auth/services/auth_service";
import { Input } from "@/shared/ui/input";

import "./register_form.css";

export function RegisterForm() {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateRegister() {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !phone.trim()
    ) {
      return "Preencha todos os campos.";
    }

    if (name.trim().length < 3) {
      return "Informe um nome com pelo menos 3 caracteres.";
    }

    if (!email.includes("@")) {
      return "Informe um email valido.";
    }

    if (password.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return "A senha deve ter pelo menos uma letra e um numero.";
    }

    if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) {
      return "Informe um telefone com 10 ou 11 digitos.";
    }

    return null;
  }

  async function handleRegister() {
    const validationError =
      validateRegister();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const cleanEmail =
      email.trim();

    try {
      await registerService({
        nome: name.trim(),
        email: cleanEmail,
        senha: password,
        telefone: phone.replace(/\D/g, ""),
      });

      await signIn({
        email: cleanEmail,
        password,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao cadastrar usuario.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="register-form"
      onSubmit={(event) => {
        event.preventDefault();
        void handleRegister();
      }}
    >
      <div className="register-form__header">
        <h1>Cadastre-se</h1>
        <p>Crie sua conta para testar o fluxo autenticado do MVP.</p>
      </div>

      {error ? (
        <p className="register-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="register-form__fields">
        <Input
          name="name"
          placeholder="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={loading}
          autoComplete="name"
        />
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          autoComplete="email"
        />
        <Input
          type="password"
          name="password"
          placeholder="Senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
          autoComplete="new-password"
        />
        <Input
          name="phone"
          placeholder="Telefone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={loading}
          autoComplete="tel"
          inputMode="tel"
        />
      </div>

      <button
        type="submit"
        className="register-form__submit"
        disabled={loading}
      >
        {loading ? "Cadastrando..." : "Criar conta"}
      </button>

      <div className="register-form__footer">
        <p>
          Ja tem conta? <Link to="/">Entre</Link>
        </p>
      </div>
    </form>
  );
}
