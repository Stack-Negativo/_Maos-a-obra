import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorMessage } from "@/shared/ui/error_message";
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
          <strong>Acessos rápidos</strong>
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
        <ErrorMessage id="form-error">{error}</ErrorMessage>
      ) : null}

      <div className="login-form__fields">
        <div className="login-form__field-group">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            autoComplete="email"
            aria-describedby={error ? "form-error" : undefined}
          />
        </div>

        <div className="login-form__field-group">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            autoComplete="current-password"
            aria-describedby={error ? "form-error" : undefined}
          />
        </div>
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
