import { Link } from "react-router-dom";

import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import { ProviderCard } from "../../components/provider_card";
import { useProviders } from "../../hooks/use_providers";

import "./providers_page.css";

export function ProvidersPage() {
  const {
    providers,
    totalProviders,
    specialties,
    form,
    search,
    specialtyFilter,
    loading,
    submitting,
    error,
    setSearch,
    setSpecialtyFilter,
    updateField,
    toggleSpecialty,
    submitProvider,
    refresh,
  } = useProviders();

  return (
    <AppShell>
      <section className="providers-page">
        <header className="providers-page__header">
          <div>
            <h1>Prestadores</h1>
            <p>
              Simule perfis de prestadores com bio e especialidades, mantendo a
              regra de pelo menos uma especialidade vinculada.
            </p>
            <p className="providers-page__summary">
              {totalProviders} prestador{totalProviders === 1 ? "" : "es"} no
              ambiente de teste.
            </p>
          </div>

          <Link to="/dashboard" className="providers-page__back-link">
            Voltar ao dashboard
          </Link>
        </header>

        <section className="providers-page__content">
          <form
            className="provider-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitProvider();
            }}
          >
            <div>
              <h2>Novo prestador</h2>
              <p>Perfil salvo apenas no navegador para testes do MVP.</p>
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
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </AppShell>
  );
}
