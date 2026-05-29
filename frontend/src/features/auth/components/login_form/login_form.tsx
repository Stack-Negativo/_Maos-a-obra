import { Input } from "@/shared/ui/input";

import { useAuth } from "../../hooks/use_auth";

import "./login_form.css";

export function LoginForm() {
  const {
    email,
    password,
    loading,
    error,

    setEmail,
    setPassword,

    handleLogin,
  } = useAuth();

  return (
    <form
      className="login-form"
      onSubmit={(event) => {
        event.preventDefault();
        void handleLogin();
      }}
    >
      <div className="login-form__header">
        <h1>Bem-vindo de volta</h1>
        <p>Acesse sua conta para acompanhar solicitações, atendimentos e prestadores.</p>
      </div>

      {error ? (
        <p className="login-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="login-form__fields">
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
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        className="login-form__submit"
        disabled={loading}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
