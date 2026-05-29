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

  const mockUsers = [
    {
      label: "Entrar como Cliente",
      email: "cliente@maosaobra.local",
      password: "12345678",
    },
    {
      label: "Entrar como Prestador",
      email: "prestador@maosaobra.local",
      password: "12345678",
    },
    {
      label: "Entrar como Admin",
      email: "admin@maosaobra.com.br",
      password: "Admin12345",
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
        <p>Entre com um perfil de teste e valide o fluxo do MVP.</p>
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

      <div className="login-form__mock-actions">
        {mockUsers.map((mockUser) => (
          <button
            key={mockUser.email}
            type="button"
            disabled={loading}
            onClick={() =>
              void handleLogin({
                email: mockUser.email,
                password: mockUser.password ?? "12345678",
              })
            }
          >
            {mockUser.label}
          </button>
        ))}
      </div>
    </form>
  );
}
