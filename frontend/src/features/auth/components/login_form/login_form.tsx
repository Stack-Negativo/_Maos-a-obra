import { Input } from "@/shared/ui/input";

import { useAuth } from "../../hooks/use_auth";

import "./login_form.css";

export function LoginForm() {
  const {
    email,
    password,
    loading,

    setEmail,
    setPassword,

    handleLogin,
  } = useAuth();

  return (
    <div className="login-form">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) =>
          setEmail(
            event.target.value,
          )
        }
      />

      <Input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(event) =>
          setPassword(
            event.target.value,
          )
        }
      />

      <button
        onClick={handleLogin}
      >
        {loading
          ? "Entrando..."
          : "Entrar"}
      </button>
    </div>
  );
}