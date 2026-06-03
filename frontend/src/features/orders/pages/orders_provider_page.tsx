import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider";
import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import { useOrdersMutations } from "../hooks";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  OrderStatus,
} from "../types/order_types";
import type { Provider } from "../types/order_types";

import "./orders_page/orders_page.css";

function buildProviderFromUser(user: ReturnType<typeof useAuthContext>["user"]) {
  if (!user) {
    return undefined;
  }

  const specialties =
    user.specialties?.map((specialty) => ({
      id: specialty.id,
      name: specialty.name,
      description: specialty.description,
      isActive: specialty.isActive ?? true,
    })) ?? [];

  return {
    id: user.providerId ?? user.id,
    name: user.name,
    bio: user.bio,
    ratingAverage: 0,
    completedServices: 0,
    isSuspended: false,
    specialties,
  } satisfies Provider;
}

export function OrdersProviderPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const currentProvider = useMemo(() => buildProviderFromUser(user), [user]);
  const {
    orders,
    loading,
    applyForOrder,
    cancelApplication,
    startOrder,
    finishOrder,
  } = useOrdersMutations(currentProvider, "provider");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    "available" | "applications" | "accepted" | "history"
  >("available");

  async function runAction(action: () => Promise<void>) {
    setActionError(null);

    try {
      await action();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a ação. Tente novamente.",
      );
    }
  }

  const providerId = currentProvider?.id ?? "";
  const providerSpecialtyIds = useMemo(
    () =>
      currentProvider?.specialties.length
        ? currentProvider.specialties.map((specialty) => specialty.id)
        : [],
    [currentProvider],
  );
  const hasProviderSpecialtiesLoaded = providerSpecialtyIds.length > 0;

  const visibleOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const specialtyCompatible =
            !hasProviderSpecialtiesLoaded ||
            providerSpecialtyIds.includes(order.specialty.id);
          const myApplication = order.applications?.find(
            (application) => application.provider.id === providerId,
          );
          const wasRejected = ["REJECTED", "CANCELLED"].includes(
            myApplication?.status ?? "",
          );
          const isAvailable =
            [
              OrderStatus.CREATED,
              OrderStatus.AWAITING_CANDIDATES,
              OrderStatus.AWAITING_SELECTION,
            ].includes(order.status) &&
            !order.selectedProvider &&
            specialtyCompatible &&
            !wasRejected;
          const isMine =
            order.selectedProvider?.id === providerId ||
            order.applications?.some(
              (application) => application.provider.id === providerId,
            );
          const isAccepted =
            order.selectedProvider?.id === providerId &&
            [
              OrderStatus.PROVIDER_SELECTED,
              OrderStatus.SCHEDULED,
              OrderStatus.IN_PROGRESS,
              OrderStatus.AWAITING_CONFIRMATION,
            ].includes(order.status);
          const isHistory =
            isMine &&
            [
              OrderStatus.FINISHED,
              OrderStatus.CANCELLED,
              OrderStatus.EXPIRED,
            ].includes(order.status);

          if (viewMode === "available") {
            return isAvailable;
          }

          if (viewMode === "applications") {
            return (
              Boolean(myApplication) &&
              myApplication?.status !== "CANCELLED" &&
              !order.selectedProvider
            );
          }

          if (viewMode === "accepted") {
            return isAccepted;
          }

          return isHistory;
        })
        .filter((order) =>
          `${order.title} ${order.description} ${order.specialty.name}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    [
      hasProviderSpecialtiesLoaded,
      orders,
      providerId,
      providerSpecialtyIds,
      search,
      viewMode,
    ],
  );

  const counts = {
    available: orders.filter(
      (order) =>
        [
          OrderStatus.CREATED,
          OrderStatus.AWAITING_CANDIDATES,
          OrderStatus.AWAITING_SELECTION,
        ].includes(order.status) &&
        !order.selectedProvider &&
        (!hasProviderSpecialtiesLoaded ||
          providerSpecialtyIds.includes(order.specialty.id)) &&
        !order.applications?.some(
          (application) =>
            application.provider.id === providerId &&
            ["REJECTED", "CANCELLED"].includes(application.status),
        ),
    ).length,
    applications: orders.filter(
      (order) =>
        order.applications?.some(
          (application) =>
            application.provider.id === providerId &&
            application.status !== "CANCELLED",
        ) && !order.selectedProvider,
    ).length,
    accepted: orders.filter(
      (order) =>
        order.selectedProvider?.id === providerId &&
        [
          OrderStatus.PROVIDER_SELECTED,
          OrderStatus.SCHEDULED,
          OrderStatus.IN_PROGRESS,
          OrderStatus.AWAITING_CONFIRMATION,
        ].includes(order.status),
    ).length,
    history: orders.filter(
      (order) =>
        (order.selectedProvider?.id === providerId ||
          order.applications?.some(
            (application) => application.provider.id === providerId,
          )) &&
        [
          OrderStatus.FINISHED,
          OrderStatus.CANCELLED,
          OrderStatus.EXPIRED,
        ].includes(order.status),
    ).length,
  };
  const openOrdersCount = orders.filter(
    (order) =>
      [
        OrderStatus.CREATED,
        OrderStatus.AWAITING_CANDIDATES,
        OrderStatus.AWAITING_SELECTION,
      ].includes(order.status) && !order.selectedProvider,
  ).length;
  const providerSpecialtiesSummary = hasProviderSpecialtiesLoaded
    ? currentProvider?.specialties.map((specialty) => specialty.name).join(", ")
    : "Complete seu perfil com especialidades para refinar o feed.";

  const workflowItems = [
    {
      label: "Disponíveis",
      value: counts.available,
      text: "Ordens compatíveis com suas especialidades.",
    },
    {
      label: "Candidaturas",
      value: counts.applications,
      text: "Interesses enviados aguardando decisão do cliente.",
    },
    {
      label: "Aceitas",
      value: counts.accepted,
      text: "Serviços para iniciar, executar ou encerrar.",
    },
  ];

  return (
    <AppShell>
      <section className="orders-page">
        <header className="orders-page__header">
          <div>
            <span className="orders-page__eyebrow">Prestador</span>
            <h1>Ordens disponíveis</h1>
            <p>
              Veja ordens compatíveis com suas especialidades, envie
              candidaturas e acompanhe atendimentos aceitos até a conclusão.
            </p>
            <p className="orders-page__summary">
              {visibleOrders.length} ordem
              {visibleOrders.length === 1 ? "" : "s"} no seu painel
            </p>
            <p className="orders-page__summary">
              {openOrdersCount} ordem{openOrdersCount === 1 ? "" : "s"} aberta
              {openOrdersCount === 1 ? "" : "s"} para candidatura
            </p>
          </div>
        </header>

        <section className="orders-page__provider-context">
          <div>
            <span>Seu perfil</span>
            <strong>{currentProvider?.name ?? "Prestador"}</strong>
          </div>
          <p>{providerSpecialtiesSummary}</p>
        </section>

        <section className="orders-page__admin-workbench orders-page__admin-workbench--provider">
          {workflowItems.map((item) => (
            <article key={item.label}>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="orders-page__filters">
          <Input
            placeholder="Buscar por título, especialidade ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={loading}
            aria-label="Buscar ordens"
          />
          <div className="orders-page__filter-tabs">
            <button
              className={`orders-page__filter-tab ${
                viewMode === "available" ? "active" : ""
              }`}
              onClick={() => setViewMode("available")}
            >
              Disponíveis ({counts.available})
            </button>
            <button
              className={`orders-page__filter-tab ${
                viewMode === "applications" ? "active" : ""
              }`}
              onClick={() => setViewMode("applications")}
            >
              Minhas candidaturas ({counts.applications})
            </button>
            <button
              className={`orders-page__filter-tab ${
                viewMode === "accepted" ? "active" : ""
              }`}
              onClick={() => setViewMode("accepted")}
            >
              Aceitas ({counts.accepted})
            </button>
            <button
              className={`orders-page__filter-tab ${
                viewMode === "history" ? "active" : ""
              }`}
              onClick={() => setViewMode("history")}
            >
              Histórico ({counts.history})
            </button>
          </div>
        </section>

        {actionError && (
          <p className="orders-page__error" role="alert">
            {actionError}
          </p>
        )}

        {loading ? (
          <p className="orders-page__state">
            Carregando ordens disponíveis...
          </p>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-page__empty">
            <p>
              {openOrdersCount === 0
                ? "Nenhuma ordem aberta para candidatura no momento."
                : "Nenhuma ordem passou pelos filtros atuais."}
            </p>
          </div>
        ) : (
          <div className="orders-page__list">
            {visibleOrders.map((order) => {
              const myApplication = order.applications?.find(
                (application) => application.provider.id === providerId,
              );
              const latestHistoryEvent =
                order.history?.[order.history.length - 1];
              const canApply =
                [
                  OrderStatus.CREATED,
                  OrderStatus.AWAITING_CANDIDATES,
                  OrderStatus.AWAITING_SELECTION,
                ].includes(order.status) &&
                !order.selectedProvider &&
                !myApplication &&
                (!hasProviderSpecialtiesLoaded ||
                  providerSpecialtyIds.includes(order.specialty.id));
              const isSpecialtyCompatible =
                !hasProviderSpecialtiesLoaded ||
                providerSpecialtyIds.includes(order.specialty.id);
              const canStart =
                order.selectedProvider?.id === providerId &&
                order.status === OrderStatus.SCHEDULED;
              const canFinish =
                order.selectedProvider?.id === providerId &&
                order.status === OrderStatus.IN_PROGRESS;
              const canCancelApplication =
                myApplication?.status === "PENDING" && !order.selectedProvider;

              return (
                <article
                  className="orders-flow-card orders-flow-card--provider"
                  key={order.id}
                >
                  <div className="orders-flow-card__header">
                    <div>
                      <span className="orders-flow-card__eyebrow">
                        {order.specialty.name}
                      </span>
                      <h2>{order.title}</h2>
                      <p>{order.description}</p>
                    </div>
                    <span className="orders-flow-card__status">
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="orders-flow-card__meta">
                    <span>
                      {order.address.neighborhood}, {order.address.city}
                    </span>
                    <span>
                      Preferência:{" "}
                      {new Date(order.preferredDate).toLocaleString("pt-BR")}
                    </span>
                    {order.scheduledAt && (
                      <span>
                        Agendamento:{" "}
                        {new Date(order.scheduledAt).toLocaleString("pt-BR")}
                      </span>
                    )}
                    {myApplication && (
                      <span>Candidatura: {myApplication.status}</span>
                    )}
                    {order.review && (
                      <span>Avaliação recebida: {order.review.rating}/5</span>
                    )}
                    {order.payment && (
                      <span>
                        Pagamento: {PAYMENT_STATUS_LABELS[order.payment.status]}
                      </span>
                    )}
                    {latestHistoryEvent && (
                      <span>Última atualização: {latestHistoryEvent.title}</span>
                    )}
                    {!myApplication && canApply && (
                      <span>Disponível para candidatura</span>
                    )}
                    {!isSpecialtyCompatible && (
                      <span>Especialidade fora do seu perfil</span>
                    )}
                  </div>

                  <div className="orders-flow-card__actions">
                    {canApply && (
                      <button
                        type="button"
                        onClick={() => {
                          void runAction(() => applyForOrder(order.id));
                        }}
                      >
                        Candidatar-se
                      </button>
                    )}
                    {canCancelApplication && myApplication && (
                      <button
                        type="button"
                        className="orders-flow-card__ghost"
                        onClick={() => {
                          void runAction(() =>
                            cancelApplication(order.id, myApplication.id),
                          );
                        }}
                      >
                        Cancelar candidatura
                      </button>
                    )}
                    {canStart && (
                      <button
                        type="button"
                        onClick={() => {
                          void runAction(() => startOrder(order.id));
                        }}
                      >
                        Iniciar atendimento
                      </button>
                    )}
                    {canFinish && (
                      <button
                        type="button"
                        onClick={() => {
                          void runAction(() => finishOrder(order.id));
                        }}
                      >
                        Encerrar atendimento
                      </button>
                    )}
                    <button
                      type="button"
                      className="orders-flow-card__ghost"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
