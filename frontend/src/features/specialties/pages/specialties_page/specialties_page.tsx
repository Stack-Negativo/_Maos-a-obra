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
  const [requestName, setRequestName] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isProvider = user?.role === UserRole.PROVIDER;
  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "PENDING"),
    [requests],
  );
  const providerRequests = useMemo(
    () => requests.filter((request) => request.requestedBy === user?.id),
    [requests, user?.id],
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
      await createCatalogSpecialty({
        name: formName,
        description: formDescription,
        isActive: true,
      });

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

  async function handleSubmitSpecialtyRequest(event: React.FormEvent) {
    event.preventDefault();

    if (!user) {
      setRequestError("Sessao expirada. Entre novamente para solicitar.");
      return;
    }

    if (requestName.trim().length < 3) {
      setRequestError("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    if (requestDescription.trim().length < 10) {
      setRequestError("Descreva quando essa especialidade deve ser usada.");
      return;
    }

    setRequestSubmitting(true);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      await submitSpecialtyRequest({
        name: requestName,
        description: requestDescription,
        requestedBy: user.id,
        requestedByName: user.name,
      });

      setRequestName("");
      setRequestDescription("");
      setRequestSuccess("Solicitacao enviada para analise do admin.");
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel enviar a solicitacao.",
      );
    } finally {
      setRequestSubmitting(false);
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
                ? "Gerencie as categorias de serviço disponíveis para clientes e prestadores."
                : "Revise as especialidades disponíveis na plataforma."}
            </p>
            <p className="specialties-page__summary">
              {activeCount} ativa{activeCount === 1 ? "" : "s"} de{" "}
              {allSpecialties.length} especialidade
              {allSpecialties.length === 1 ? "" : "s"} cadastrada
              {allSpecialties.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="specialties-page__header-actions">
            <Link
              to={isAdmin ? "/orders/admin" : "/orders/provider"}
              className="specialties-page__back-link"
            >
              Voltar para ordens
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

        {isAdmin && (
          <section className="specialties-page__panel">
            <div>
              <h2>Cadastrar especialidade</h2>
              <p>A especialidade criada fica disponível imediatamente no catálogo.</p>
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
                {submitting ? "Salvando..." : "Criar especialidade"}
              </button>
            </form>
          </section>
        )}

        {isAdmin && pendingRequests.length > 0 && (
          <section className="specialties-page__panel">
            <div className="specialties-page__panel-header">
              <div>
                <h2>Solicitações de prestadores</h2>
                <p>Avalie novas categorias sugeridas por prestadores.</p>
              </div>
              <strong>{pendingRequests.length} pendente(s)</strong>
            </div>

            <div className="specialties-page__requests">
              {pendingRequests.map((request) => (
                <article className="specialties-page__request" key={request.id}>
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
                      ✅ Aprovar
                    </button>
                    <button
                      type="button"
                      className="specialties-page__ghost"
                      onClick={() => {
                        void rejectRequest(request.id);
                      }}
                    >
                      ❌ Recusar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {isProvider && (
          <section className="specialties-page__panel specialties-page__panel--provider-request">
            <div className="specialties-page__panel-header">
              <div>
                <h2>🧰 Solicitar nova especialidade</h2>
                <p>
                  Nao encontrou uma categoria que representa seu trabalho?
                  Envie uma sugestao para o admin avaliar.
                </p>
              </div>
              <strong>{providerRequests.length} enviada(s)</strong>
            </div>

            {requestError && (
              <p className="specialties-page__form-error" role="alert">
                {requestError}
              </p>
            )}
            {requestSuccess && (
              <p className="specialties-page__form-success" role="status">
                {requestSuccess}
              </p>
            )}

            <form
              className="specialties-page__form specialties-page__form--request"
              onSubmit={(event) => {
                void handleSubmitSpecialtyRequest(event);
              }}
            >
              <Input
                placeholder="Ex.: Jardinagem"
                value={requestName}
                onChange={(event) => setRequestName(event.target.value)}
                disabled={requestSubmitting}
              />
              <textarea
                placeholder="Explique quais servicos entram nessa especialidade"
                value={requestDescription}
                onChange={(event) => setRequestDescription(event.target.value)}
                disabled={requestSubmitting}
              />
              <button type="submit" disabled={requestSubmitting}>
                {requestSubmitting ? "⏳ Enviando..." : "📨 Enviar sugestao"}
              </button>
            </form>

            {providerRequests.length > 0 && (
              <div className="specialties-page__requests specialties-page__requests--compact">
                {providerRequests.map((request) => (
                  <article className="specialties-page__request" key={request.id}>
                    <div>
                      <strong>{request.name}</strong>
                      <p>{request.description}</p>
                      <small>
                        Enviada em{" "}
                        {new Date(request.createdAt).toLocaleString("pt-BR")}
                      </small>
                    </div>
                    <span
                      className={`specialties-page__request-status specialties-page__request-status--${request.status.toLowerCase()}`}
                    >
                      {request.status === "PENDING"
                        ? "⏳ Em analise"
                        : request.status === "APPROVED"
                          ? "✅ Aprovada"
                          : "❌ Recusada"}
                    </span>
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

        {isProvider && (
          <section className="specialties-page__panel specialties-page__panel--tip">
            <h2>✅ Catalogo disponivel</h2>
            <p>
              As especialidades aprovadas pelo admin aparecem aqui e ficam
              disponiveis para clientes abrirem novas ordens.
            </p>
          </section>
        )}
      </section>
    </AppShell>
  );
}
