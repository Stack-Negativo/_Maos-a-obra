import { Link } from "react-router-dom";

import { SpecialtyCard } from "@/features/specialties/components/specialty_card/specialty_card";
import { useSpecialties } from "@/features/specialties/hooks/use_specialties";
import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import "./specialties_page.css";

export function SpecialtiesPage() {
  const {
    specialties,
    loading,
    error,
    search,
    setSearch,
    refresh,
  } = useSpecialties();

  return (
    <AppShell>
      <section className="specialties-page">
      <header className="specialties-page__header">
        <div>
          <h1>Especialidades</h1>
          <p>
            Valide a listagem protegida, o filtro local e a integracao com o
            endpoint de especialidades.
          </p>
          <p className="specialties-page__summary">
            {specialties.length} especialidade
            {specialties.length === 1 ? "" : "s"} exibida
            {specialties.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="specialties-page__header-actions">
          <Link to="/dashboard" className="specialties-page__back-link">
            Voltar ao dashboard
          </Link>
        </div>
      </header>

      <section className="specialties-page__actions">
        <Input
          placeholder="Buscar especialidades"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={loading}
          aria-label="Buscar especialidades"
        />
        <button
          type="button"
          onClick={() => {
            void refresh();
          }}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </section>

      {loading ? (
        <p className="specialties-page__state">Carregando especialidades...</p>
      ) : error ? (
        <p className="specialties-page__state specialties-page__state--error">
          {error}
        </p>
      ) : specialties.length === 0 ? (
        <p className="specialties-page__state">
          Nenhuma especialidade encontrada.
        </p>
      ) : (
        <div className="specialties-page__list">
          {specialties.map((specialty) => (
            <SpecialtyCard
              key={specialty.id}
              specialty={specialty}
            />
          ))}
        </div>
      )}
      </section>
    </AppShell>
  );
}
