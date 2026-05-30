import { Input } from "@/shared/ui/input";
import { isMockMode } from "@/shared/mocks/mock_mode";

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

  const demoAccounts = [
    {
      label: "Admin",
      email: "admin@maosaobra.com.br",
      password: "Admin12345",
    },
    {
      label: "Cliente",
      email: "cliente@maosaobra.com.br",
      password: "Cliente123",
    },
    {
      label: "Prestador",
      email: "prestador@maosaobra.com.br",
      password: "Prestador123",
    },
  ];

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

      {isMockMode() && (
        <div className="login-form__demo">
          <strong>Contas para teste</strong>
          <div>
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
