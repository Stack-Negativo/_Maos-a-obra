import { Link } from "react-router-dom";

import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import { useAuthContext } from "@/app/providers/auth_provider/use_auth_context";
import { UserRole } from "@/features/auth/types/auth_types";
import { useProviders } from "../../hooks/use_providers";

import "./providers_page.css";

export function ProvidersPage() {
  const { user } = useAuthContext();
  const isProvider = user?.role === UserRole.PROVIDER;
  const isAdmin = user?.role === UserRole.ADMIN || user?.isAdmin === true;

  const {
    providers,
    totalProviders,
    activeProviders,
    suspendedProviders,
    specialties,
    form,
    search,
    specialtyFilter,
    loading,
    submitting,
    updatingProviderId,
    error,
    setSearch,
    setSpecialtyFilter,
    updateField,
    toggleSpecialty,
    submitProvider,
    suspendProvider,
    unsuspendProvider,
    refresh,
  } = useProviders();

  return (
    <AppShell>
      <section className="providers-page">
        <header className="providers-page__header">
          <div>
            <span className="providers-page__eyebrow">
              {isAdmin ? "Administração" : "Rede de atendimento"}
            </span>
            <h1>Prestadores</h1>
            <p>
              Acompanhe perfis profissionais, especialidades e disponibilidade
              da rede que atende as ordens de serviço.
            </p>
            <p className="providers-page__summary">
              {totalProviders} prestador{totalProviders === 1 ? "" : "es"} no
              sistema.
            </p>
          </div>

          <Link to="/dashboard" className="providers-page__back-link">
            Voltar ao dashboard
          </Link>
        </header>

        <section className="providers-page__metrics">
          <article>
            <span>Total</span>
            <strong>{totalProviders}</strong>
          </article>
          <article>
            <span>Ativos</span>
            <strong>{activeProviders}</strong>
          </article>
          <article>
            <span>Suspensos</span>
            <strong>{suspendedProviders}</strong>
          </article>
          <article>
            <span>Especialidades</span>
            <strong>{specialties.length}</strong>
          </article>
        </section>

        <section className="providers-page__content">
          {isProvider ? (
            <form
              className="provider-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitProvider();
              }}
            >
              <div>
                <h2>Novo prestador</h2>
                <p>
                  Cadastre seu perfil de prestador no backend. Se a conexão
                  falhar, o cadastro será salvo localmente para testes.
                </p>
              </div>

              {error ? (
                <p className="provider-form__error" role="alert">
                  {error}
                </p>
              ) : null}

              <Input
                placeholder="Nome profissional"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                disabled={submitting}
              />

              <textarea
                placeholder="Bio profissional"
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                disabled={submitting}
                rows={5}
              />

              <div className="provider-form__specialties">
                <strong>Especialidades</strong>
                <div>
                  {specialties.map((specialty) => (
                    <button
                      key={specialty.id}
                      type="button"
                      className={
                        form.specialtyIds.includes(specialty.id)
                          ? "provider-form__chip provider-form__chip--active"
                          : "provider-form__chip"
                      }
                      onClick={() => toggleSpecialty(specialty.id)}
                      disabled={submitting}
                    >
                      {specialty.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="provider-form__submit"
                disabled={submitting}
              >
                {submitting ? "Salvando..." : "Adicionar prestador"}
              </button>
            </form>
          ) : isAdmin ? (
            <div className="provider-form provider-form--insight">
              <div>
                <h2>Governança da rede</h2>
                <p>
                  Perfis criados por cadastro de prestador ou pelo botão “Quero
                  me tornar prestador” aparecem nesta visão administrativa.
                </p>
              </div>
              <div className="provider-form__insights">
                <span>{activeProviders} ativo(s)</span>
                <span>{suspendedProviders} suspenso(s)</span>
                <span>{specialties.length} especialidade(s) ativas</span>
              </div>
            </div>
          ) : (
            <div className="provider-form provider-form--disabled">
              <div>
                <h2>Perfil de prestador</h2>
                <p>
                  Somente prestadores podem cadastrar um perfil profissional.
                  Clientes podem procurar e avaliar prestadores disponíveis.
                </p>
              </div>
            </div>
          )}

          <section className="providers-list">
            <div className="providers-list__toolbar">
              <Input
                placeholder="Buscar prestadores"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={loading}
                aria-label="Buscar prestadores"
              />

              <select
                value={specialtyFilter}
                onChange={(event) => setSpecialtyFilter(event.target.value)}
                disabled={loading}
                aria-label="Filtrar por especialidade"
              >
                <option value="all">Todas</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  void refresh();
                }}
                disabled={loading}
              >
                {loading ? "Atualizando..." : "Atualizar"}
              </button>
            </div>

            {loading ? (
              <p className="providers-list__state">Carregando prestadores...</p>
            ) : providers.length === 0 ? (
              <p className="providers-list__state">
                Nenhum prestador encontrado.
              </p>
            ) : (
              <div className="providers-list__items">
                {providers.map((provider) => (
                  <article className="providers-admin-card" key={provider.id}>
                    <div className="providers-admin-card__main">
                      <div>
                        <strong>{provider.name}</strong>
                        <p>{provider.bio || "Bio profissional não informada."}</p>
                      </div>
                      <span
                        className={
                          provider.isSuspended
                            ? "providers-admin-card__status providers-admin-card__status--suspended"
                            : "providers-admin-card__status"
                        }
                      >
                        {provider.isSuspended ? "Suspenso" : "Ativo"}
                      </span>
                    </div>

                    <div className="providers-admin-card__chips">
                      {provider.specialties.map((specialty) => (
                        <span key={specialty.id}>{specialty.name}</span>
                      ))}
                    </div>

                    <div className="providers-admin-card__meta">
                      <span>Nota {provider.ratingAverage.toFixed(1)}</span>
                      <span>{provider.completedServices} serviço(s)</span>
                    </div>

                    <div className="providers-admin-card__actions">
                      <strong>Ação administrativa</strong>
                      {provider.isSuspended ? (
                        <button
                          type="button"
                          onClick={() => {
                            void unsuspendProvider(provider.id);
                          }}
                          disabled={updatingProviderId === provider.id}
                        >
                          {updatingProviderId === provider.id
                            ? "Reativando..."
                            : "Reativar prestador"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="providers-admin-card__danger"
                          onClick={() => {
                            void suspendProvider(provider.id);
                          }}
                          disabled={updatingProviderId === provider.id}
                        >
                          {updatingProviderId === provider.id
                            ? "Suspendendo..."
                            : "Suspender prestador"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </AppShell>
  );
}
