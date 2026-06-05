import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider/use_auth_context";
import {
  becomeProviderService,
  registerService,
} from "@/features/auth/services/auth_service";
import { listSpecialties } from "@/features/specialties/services/specialties_service";
import type { Specialty } from "@/features/specialties/types/specialty_types";
import type { User } from "@/features/auth/types/auth_types";
import { UserRole } from "@/features/auth/types/auth_types";
import { Input } from "@/shared/ui/input";

import "./register_form.css";

const SPECIALTIES_ERROR = "Não foi possível carregar as especialidades.";

export function RegisterForm() {
  const navigate = useNavigate();
  const { signIn, updateUser } = useAuthContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<
    UserRole.CLIENT | UserRole.PROVIDER
  >(UserRole.CLIENT);
  const [bio, setBio] = useState("");
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([]);
  const [specialtyOptions, setSpecialtyOptions] = useState<Specialty[]>([]);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSpecialties = useCallback(async () => {
    setSpecialtiesLoading(true);

    try {
      const specialties = await listSpecialties();
      const activeSpecialties = specialties.filter(
        (specialty) => specialty.isActive,
      );

      setSpecialtyOptions(activeSpecialties);
      setSpecialtyIds((currentIds) => {
        if (activeSpecialties.length === 0) {
          return [];
        }

        return currentIds.some((id) =>
          activeSpecialties.some((specialty) => specialty.id === id),
        )
          ? currentIds
          : [activeSpecialties[0].id];
      });
      setError((currentError) =>
        currentError === SPECIALTIES_ERROR ? null : currentError,
      );
      return activeSpecialties;
    } catch (err) {
      console.error(err);
      setSpecialtyOptions([]);
      setSpecialtyIds([]);
      setError(SPECIALTIES_ERROR);
      return [];
    } finally {
      setSpecialtiesLoading(false);
    }
  }, []);

  function selectClientAccount() {
    setAccountType(UserRole.CLIENT);
    setError(null);
  }

  async function selectProviderAccount() {
    setAccountType(UserRole.PROVIDER);
    setError(null);

    if (specialtyOptions.length === 0) {
      await loadSpecialties();
    }
  }

  async function ensureProviderSpecialtiesLoaded() {
    if (accountType !== UserRole.PROVIDER || specialtyOptions.length > 0) {
      return true;
    }

    const loadedSpecialties = await loadSpecialties();
    return loadedSpecialties.length > 0;
  }

  function validateRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      return "Preencha todos os campos.";
    }

    if (name.trim().length < 3) {
      return "Informe um nome com pelo menos 3 caracteres.";
    }

    if (!email.includes("@")) {
      return "Informe um email válido.";
    }

    if (password.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return "A senha deve ter pelo menos uma letra e um número.";
    }

    if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) {
      return "Informe um telefone com 10 ou 11 dígitos.";
    }

    if (accountType === UserRole.PROVIDER) {
      if (bio.trim().length < 20) {
        return "Descreva sua experiência como prestador em pelo menos 20 caracteres.";
      }

      if (specialtyOptions.length === 0) {
        return "Nenhuma especialidade ativa foi carregada. Tente novamente.";
      }

      if (specialtyIds.length === 0) {
        return "Selecione pelo menos uma especialidade.";
      }
    }

    return null;
  }

  async function handleRegister() {
    if (!(await ensureProviderSpecialtiesLoaded())) {
      setError(SPECIALTIES_ERROR);
      return;
    }

    const validationError = validateRegister();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const cleanEmail = email.trim();

    try {
      await registerService({
        nome: name.trim(),
        email: cleanEmail,
        senha: password,
        telefone: phone.replace(/\D/g, ""),
        role: accountType,
        bio,
        specialtyIds,
      });

      await signIn({
        email: cleanEmail,
        password,
      });

      if (accountType === UserRole.PROVIDER) {
        const storedUser = localStorage.getItem("user");
        const signedUser = storedUser ? (JSON.parse(storedUser) as User) : null;

        if (signedUser) {
          const providerUser = await becomeProviderService(signedUser, {
            bio,
            specialtyIds,
          });
          updateUser(providerUser);
        }
      }

      navigate(
        accountType === UserRole.PROVIDER
          ? "/orders/provider"
          : "/orders/client",
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao cadastrar usuário.");
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
        <p>Escolha como quer entrar no sistema e siga para o painel correto.</p>
      </div>

      {error ? (
        <p className="register-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="register-form__fields">
        <div className="register-form__role-grid" role="radiogroup">
          <button
            type="button"
            className={
              accountType === UserRole.CLIENT
                ? "register-form__role-card register-form__role-card--active"
                : "register-form__role-card"
            }
            onClick={selectClientAccount}
            disabled={loading}
          >
            <strong>Cliente</strong>
            <span>Criar ordens, escolher prestadores e avaliar serviços.</span>
          </button>
          <button
            type="button"
            className={
              accountType === UserRole.PROVIDER
                ? "register-form__role-card register-form__role-card--active"
                : "register-form__role-card"
            }
            onClick={() => {
              void selectProviderAccount();
            }}
            disabled={loading || specialtiesLoading}
          >
            <strong>Prestador</strong>
            <span>Ver ordens disponíveis e se candidatar a serviços.</span>
          </button>
        </div>

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

        {accountType === UserRole.PROVIDER && (
          <div className="register-form__provider-fields">
            <label>
              Bio profissional
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                disabled={loading}
                placeholder="Conte sua experiência, região de atendimento e tipo de serviço que faz."
              />
            </label>
            <fieldset disabled={loading || specialtiesLoading}>
              <legend>
                {specialtiesLoading ? "Carregando..." : "Especialidades"}
              </legend>
              {specialtyOptions.length === 0 && !specialtiesLoading ? (
                <button
                  type="button"
                  onClick={() => {
                    void loadSpecialties();
                  }}
                >
                  Tentar carregar especialidades
                </button>
              ) : (
                <div className="register-form__specialties">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty.id}>
                      <input
                        type="checkbox"
                        checked={specialtyIds.includes(specialty.id)}
                        onChange={(event) => {
                          setSpecialtyIds((currentIds) =>
                            event.target.checked
                              ? [...currentIds, specialty.id]
                              : currentIds.filter((id) => id !== specialty.id),
                          );
                        }}
                      />
                      <span>{specialty.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="register-form__submit"
        disabled={loading || specialtiesLoading}
      >
        {loading ? "Cadastrando..." : "Criar conta"}
      </button>

      <div className="register-form__footer">
        <p>
          Já tem conta? <Link to="/">Entre</Link>
        </p>
      </div>
    </form>
  );
}
