import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider";
import { UserRole } from "@/features/auth/types/auth_types";
import { SpecialtyCard } from "@/features/specialties/components/specialty_card/specialty_card";
import { useSpecialties } from "@/features/specialties/hooks/use_specialties";
import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import "./specialties_page.css";

export function SpecialtiesPage() {
  const { user } = useAuthContext();
  const {
    specialties,
    allSpecialties,
    requests,
    loading,
    error,
    search,
    setSearch,
    refresh,
    createCatalogSpecialty,
    toggleCatalogSpecialty,
    submitSpecialtyRequest,
    approveRequest,
    rejectRequest,
  } = useSpecialties();
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isProvider = user?.role === UserRole.PROVIDER;
  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "PENDING"),
    [requests],
  );
  const approvedRequests = useMemo(
    () => requests.filter((request) => request.status !== "PENDING"),
    [requests],
  );
  const activeCount = allSpecialties.filter(
    (specialty) => specialty.isActive,
  ).length;

  async function handleSubmitSpecialty(event: React.FormEvent) {
    event.preventDefault();

    if (formName.trim().length < 3) {
      setFormError("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    if (formDescription.trim().length < 10) {
      setFormError("Informe uma descrição com pelo menos 10 caracteres.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (isAdmin) {
        await createCatalogSpecialty({
          name: formName,
          description: formDescription,
          isActive: true,
        });
      } else if (user) {
        await submitSpecialtyRequest({
          name: formName,
          description: formDescription,
          requestedBy: user.id,
          requestedByName: user.name,
        });
      }

      setFormName("");
      setFormDescription("");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a especialidade.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <section className="specialties-page">
        <header className="specialties-page__header">
          <div>
            <h1>Especialidades</h1>
            <p>
              {isAdmin
                ? "Gerencie o catálogo operacional usado para casar ordens com prestadores elegíveis."
                : "Revise suas áreas de atuação e solicite novas especialidades ao administrador."}
            </p>
            <p className="specialties-page__summary">
              {activeCount} ativa{activeCount === 1 ? "" : "s"} de{" "}
              {allSpecialties.length} especialidade
              {allSpecialties.length === 1 ? "" : "s"} cadastrada
              {allSpecialties.length === 1 ? "" : "s"}.
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

        {(isAdmin || isProvider) && (
          <section className="specialties-page__panel">
            <div>
              <h2>
                {isAdmin
                  ? "Cadastrar especialidade"
                  : "Solicitar nova especialidade"}
              </h2>
              <p>
                {isAdmin
                  ? "A especialidade criada entra ativa no catálogo do MVP."
                  : "O admin avalia a solicitação antes de liberar no catálogo."}
              </p>
            </div>
            {formError && (
              <p className="specialties-page__form-error" role="alert">
                {formError}
              </p>
            )}
            <form
              className="specialties-page__form"
              onSubmit={(event) => {
                void handleSubmitSpecialty(event);
              }}
            >
              <Input
                placeholder="Nome da especialidade"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                disabled={submitting}
              />
              <textarea
                placeholder="Descrição operacional"
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                disabled={submitting}
              />
              <button type="submit" disabled={submitting}>
                {submitting
                  ? "Salvando..."
                  : isAdmin
                    ? "Criar especialidade"
                    : "Enviar solicitação"}
              </button>
            </form>
          </section>
        )}

        {isAdmin && (
          <section className="specialties-page__panel">
            <div className="specialties-page__panel-header">
              <div>
                <h2>Solicitações de prestadores</h2>
                <p>
                  Aprove novas áreas de atuação ou recuse solicitações fora do
                  escopo do catálogo.
                </p>
              </div>
              <strong>{pendingRequests.length} pendente(s)</strong>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="specialties-page__state">
                Nenhuma solicitação pendente.
              </p>
            ) : (
              <div className="specialties-page__requests">
                {pendingRequests.map((request) => (
                  <article
                    className="specialties-page__request"
                    key={request.id}
                  >
                    <div>
                      <strong>{request.name}</strong>
                      <p>{request.description}</p>
                      <small>
                        Solicitada por {request.requestedByName} em{" "}
                        {new Date(request.createdAt).toLocaleString("pt-BR")}
                      </small>
                    </div>
                    <div className="specialties-page__request-actions">
                      <button
                        type="button"
                        onClick={() => {
                          void approveRequest(request.id);
                        }}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className="specialties-page__ghost"
                        onClick={() => {
                          void rejectRequest(request.id);
                        }}
                      >
                        Recusar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {loading ? (
          <p className="specialties-page__state">
            Carregando especialidades...
          </p>
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
                onToggle={
                  isAdmin
                    ? () => {
                        void toggleCatalogSpecialty(specialty.id);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {isProvider && approvedRequests.length > 0 && (
          <section className="specialties-page__panel">
            <h2>Histórico das minhas solicitações</h2>
            <div className="specialties-page__requests">
              {approvedRequests
                .filter((request) => request.requestedBy === user?.id)
                .map((request) => (
                  <article
                    className="specialties-page__request"
                    key={request.id}
                  >
                    <div>
                      <strong>{request.name}</strong>
                      <p>{request.description}</p>
                    </div>
                    <span className="specialties-page__request-status">
                      {request.status === "APPROVED" ? "Aprovada" : "Recusada"}
                    </span>
                  </article>
                ))}
            </div>
          </section>
        )}
      </section>
    </AppShell>
  );
}
