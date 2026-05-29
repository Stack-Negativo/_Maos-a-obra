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

const FALLBACK_PROVIDER_SPECIALTIES = ["hidraulica", "eletrica"];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

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
    ratingAverage: 4.7,
    completedServices: user.id === "mock-provider" ? 52 : 0,
    isSuspended: false,
    specialties,
  } satisfies Provider;
}

export function OrdersProviderPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const currentProvider = buildProviderFromUser(user);
  const {
    orders,
    loading,
    applyForOrder,
    cancelApplication,
    startOrder,
    finishOrder,
  } = useOrdersMutations(currentProvider, "provider");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<
    "available" | "applications" | "accepted" | "history"
  >("available");

  const providerId = currentProvider?.id ?? "mock-provider";
  const providerSpecialtyNames =
    currentProvider?.specialties.length
      ? currentProvider.specialties.map((specialty) =>
          normalizeText(specialty.name),
        )
      : FALLBACK_PROVIDER_SPECIALTIES;

  const visibleOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const specialtyCompatible = providerSpecialtyNames.includes(
            normalizeText(order.specialty.name),
          );
          const myApplication = order.applications?.find(
            (application) => application.provider.id === providerId,
          );
          const wasRejected = myApplication?.status === "REJECTED";
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
            return Boolean(myApplication) && !order.selectedProvider;
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
    [orders, providerId, providerSpecialtyNames, search, viewMode],
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
        providerSpecialtyNames.includes(normalizeText(order.specialty.name)) &&
        !order.applications?.some(
          (application) =>
            application.provider.id === providerId &&
            application.status === "REJECTED",
        ),
    ).length,
    applications: orders.filter(
      (order) =>
        order.applications?.some(
          (application) => application.provider.id === providerId,
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
            <h1>Feed do Prestador</h1>
            <p>
              Veja ordens compatíveis com suas especialidades, envie
              candidaturas e acompanhe atendimentos aceitos até a finalização.
            </p>
            <p className="orders-page__summary">
              {visibleOrders.length} ordem
              {visibleOrders.length === 1 ? "" : "s"} no seu painel
            </p>
          </div>
        </header>

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

        {loading ? (
          <p className="orders-page__state">
            Carregando ordens disponíveis...
          </p>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-page__empty">
            <p>Nenhuma ordem disponível no momento.</p>
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
                providerSpecialtyNames.includes(
                  normalizeText(order.specialty.name),
                );
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
                      <span>Último evento: {latestHistoryEvent.title}</span>
                    )}
                    {!myApplication && canApply && (
                      <span>Disponível para candidatura</span>
                    )}
                  </div>

                  <div className="orders-flow-card__actions">
                    {canApply && (
                      <button
                        type="button"
                        onClick={() => applyForOrder(order.id)}
                      >
                        Candidatar-se
                      </button>
                    )}
                    {canCancelApplication && myApplication && (
                      <button
                        type="button"
                        className="orders-flow-card__ghost"
                        onClick={() =>
                          cancelApplication(order.id, myApplication.id)
                        }
                      >
                        Cancelar candidatura
                      </button>
                    )}
                    {canStart && (
                      <button
                        type="button"
                        onClick={() => startOrder(order.id)}
                      >
                        Iniciar serviço
                      </button>
                    )}
                    {canFinish && (
                      <button
                        type="button"
                        onClick={() => finishOrder(order.id)}
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
