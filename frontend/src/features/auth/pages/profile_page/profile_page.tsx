import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider";
import { becomeProviderService } from "@/features/auth/services/auth_service";
import { listSpecialties } from "@/features/specialties/services/specialties_service";
import type { Specialty } from "@/features/specialties/types/specialty_types";
import { UserRole } from "@/features/auth/types/auth_types";
import { AppShell } from "@/shared/components";

import "./profile_page.css";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthContext();
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(
    user?.specialties?.map((specialty) => specialty.id) ?? [],
  );
  const [specialtyOptions, setSpecialtyOptions] = useState<Specialty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  const roleLabel = useMemo(() => {
    if (user?.role === UserRole.ADMIN) {
      return "Administrador";
    }

    if (user?.role === UserRole.PROVIDER) {
      return "Prestador";
    }

    return "Cliente";
  }, [user?.role]);

  async function loadSpecialties() {
    if (specialtyOptions.length > 0 || loadingSpecialties) {
      return specialtyOptions;
    }

    setLoadingSpecialties(true);
    setError(null);

    try {
      const specialties = await listSpecialties();
      const activeSpecialties = specialties.filter(
        (specialty) => specialty.isActive,
      );

      setSpecialtyOptions(activeSpecialties);
      setSpecialtyIds((currentIds) =>
        currentIds.some((id) =>
          activeSpecialties.some((specialty) => specialty.id === id),
        )
          ? currentIds
          : activeSpecialties[0]
            ? [activeSpecialties[0].id]
            : currentIds,
      );

      return activeSpecialties;
    } catch {
      setError("Nao foi possivel carregar especialidades do backend.");
      return [];
    } finally {
      setLoadingSpecialties(false);
    }
  }

  if (!user) {
    return null;
  }

  async function handleBecomeProvider() {
    if (!user) {
      return;
    }

    if (bio.trim().length < 20) {
      setError("Informe uma bio profissional com pelo menos 20 caracteres.");
      return;
    }

    const specialties = await loadSpecialties();
    const selectedIds =
      specialtyIds.length > 0
        ? specialtyIds
        : specialties[0]
          ? [specialties[0].id]
          : [];

    if (selectedIds.length === 0) {
      setError("Selecione pelo menos uma especialidade.");
      return;
    }

    try {
      const providerUser = await becomeProviderService(user, {
        bio,
        specialtyIds: selectedIds,
      });

      updateUser(providerUser);
      setError(null);
      navigate("/orders/provider");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível ativar o perfil de prestador.",
      );
    }
  }

  return (
    <AppShell>
      <section className="profile-page">
        <header className="profile-page__header">
          <div>
            <span className="profile-page__eyebrow">Perfil</span>
            <h1>{user.name}</h1>
            <p>
              Revise seu acesso atual e mantenha o cadastro preparado para o
              fluxo real da API.
            </p>
          </div>
          <span className="profile-page__role">{roleLabel}</span>
        </header>

        <div className="profile-page__grid">
          <section className="profile-page__section">
            <h2>Dados da conta</h2>
            <dl className="profile-page__details">
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Perfil ativo</dt>
                <dd>{roleLabel}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{user.isAdmin ? "Gestão da plataforma" : "Conta ativa"}</dd>
              </div>
            </dl>
          </section>

          <section className="profile-page__section">
            <h2>Perfil de prestador</h2>
            {user.role === UserRole.ADMIN ? (
              <p className="profile-page__muted">
                Administradores não participam do fluxo operacional como
                cliente ou prestador.
              </p>
            ) : user.role === UserRole.PROVIDER ? (
              <div className="profile-page__provider-summary">
                <p>{user.bio || "Bio profissional não informada."}</p>
                <div className="profile-page__chips">
                  {user.specialties?.map((specialty) => (
                    <span key={specialty.id}>{specialty.name}</span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <p className="profile-page__muted">
                  Clientes podem ativar o perfil de prestador informando uma bio
                  e ao menos uma especialidade, como previsto no fluxo de
                  tornar-se prestador.
                </p>
                {!showProviderForm ? (
                  <button
                    type="button"
                    className="profile-page__primary"
                    onClick={() => {
                      setShowProviderForm(true);
                      void loadSpecialties();
                    }}
                  >
                    Quero me tornar prestador
                  </button>
                ) : (
                  <form
                    className="profile-page__provider-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleBecomeProvider();
                    }}
                  >
                    {error && (
                      <p className="profile-page__error" role="alert">
                        {error}
                      </p>
                    )}
                    <label>
                      Bio profissional
                      <textarea
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        placeholder="Conte sua experiência, serviços realizados e região de atendimento."
                      />
                    </label>
                    <fieldset>
                      <legend>Especialidades</legend>
                      <div className="profile-page__chips profile-page__chips--selectable">
                        {loadingSpecialties ? (
                          <p className="profile-page__muted">
                            Carregando especialidades...
                          </p>
                        ) : (
                          specialtyOptions.map((specialty) => (
                          <label key={specialty.id}>
                            <input
                              type="checkbox"
                              checked={specialtyIds.includes(specialty.id)}
                              onChange={(event) => {
                                setSpecialtyIds((currentIds) =>
                                  event.target.checked
                                    ? [...currentIds, specialty.id]
                                    : currentIds.filter(
                                        (id) => id !== specialty.id,
                                      ),
                                );
                              }}
                            />
                            <span>{specialty.name}</span>
                          </label>
                          ))
                        )}
                      </div>
                    </fieldset>
                    <div className="profile-page__actions">
                      <button type="submit" className="profile-page__primary">
                        Ativar perfil de prestador
                      </button>
                      <button
                        type="button"
                        className="profile-page__ghost"
                        onClick={() => setShowProviderForm(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      </section>
    </AppShell>
  );
}
