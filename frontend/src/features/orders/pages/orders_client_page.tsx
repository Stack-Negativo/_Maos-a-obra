import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "@/shared/components";

import { useOrdersMutations } from "../hooks";
import {
  PAYMENT_STATUS_LABELS,
  OrderStatus,
} from "../types/order_types";
import type { Order } from "../types/order_types";
import type { Provider } from "../types/order_types";
import { ORDER_STATUS_LABELS } from "../types/order_types";

import "./orders_page/orders_page.css";

function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getScheduleValue(
  order: Order,
  scheduleValues: Record<string, string>,
) {
  return (
    scheduleValues[order.id] ??
    toDateTimeLocalValue(order.scheduledAt ?? order.preferredDate)
  );
}

function getProviderInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProviderMiniCard({ provider }: { provider: Provider }) {
  return (
    <div className="orders-flow-card__provider-mini">
      <span className="orders-flow-card__provider-avatar">
        {provider.photoUrl ? (
          <img src={provider.photoUrl} alt="" loading="lazy" />
        ) : (
          getProviderInitials(provider.name) || "P"
        )}
      </span>
      <div>
        <span>Prestador</span>
        <strong>{provider.name}</strong>
      </div>
      <small>Nota {provider.ratingAverage.toFixed(1)}</small>
    </div>
  );
}

export function OrdersClientPage() {
  const navigate = useNavigate();
  const {
    orders,
    loading,
    acceptApplication,
    rejectApplication,
    scheduleOrder,
    confirmFinished,
    cancelOrder,
  } = useOrdersMutations(undefined, "client");
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>(
    {},
  );
  const [viewMode, setViewMode] = useState<
    "active" | "selection" | "schedule" | "confirmation" | "history"
  >("active");
  const [actionError, setActionError] = useState<string | null>(null);
  const minScheduleValue = toDateTimeLocalValue(new Date().toISOString());

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

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      if (viewMode === "selection") {
        return order.status === OrderStatus.AWAITING_SELECTION;
      }

      if (viewMode === "schedule") {
        return order.status === OrderStatus.PROVIDER_SELECTED;
      }

      if (viewMode === "confirmation") {
        return order.status === OrderStatus.AWAITING_CONFIRMATION;
      }

      if (viewMode === "history") {
        return [
          OrderStatus.FINISHED,
          OrderStatus.CANCELLED,
          OrderStatus.EXPIRED,
        ].includes(order.status);
      }

      return ![
        OrderStatus.FINISHED,
        OrderStatus.CANCELLED,
        OrderStatus.EXPIRED,
      ].includes(order.status);
    });
  }, [orders, viewMode]);

  const counts = {
    active: orders.filter(
      (order) =>
        ![
          OrderStatus.FINISHED,
          OrderStatus.CANCELLED,
          OrderStatus.EXPIRED,
        ].includes(order.status),
    ).length,
    selection: orders.filter(
      (order) => order.status === OrderStatus.AWAITING_SELECTION,
    ).length,
    schedule: orders.filter(
      (order) => order.status === OrderStatus.PROVIDER_SELECTED,
    ).length,
    confirmation: orders.filter(
      (order) => order.status === OrderStatus.AWAITING_CONFIRMATION,
    ).length,
    history: orders.filter((order) =>
      [
        OrderStatus.FINISHED,
        OrderStatus.CANCELLED,
        OrderStatus.EXPIRED,
      ].includes(order.status),
    ).length,
  };

  function handleConfirmFinished(orderId: string) {
    setRatingOrderId(orderId);
  }

  const workflowItems = [
    {
      label: "Escolher prestador",
      value: counts.selection,
      text: "Candidaturas aguardando sua decisão.",
    },
    {
      label: "Agendar",
      value: counts.schedule,
      text: "Prestadores aceitos aguardando horário.",
    },
    {
      label: "Confirmar finalização",
      value: counts.confirmation,
      text: "Atendimentos encerrados aguardando sua avaliação.",
    },
  ];

  return (
    <AppShell>
      <section className="orders-page">
        <header className="orders-page__header">
          <div>
            <span className="orders-page__eyebrow">Cliente</span>
            <h1>Minhas ordens</h1>
            <p>
              Crie ordens, acompanhe candidaturas, selecione prestadores,
              confirme agendamentos e avalie serviços finalizados.
            </p>
            <p className="orders-page__summary">
              {visibleOrders.length} ordem
              {visibleOrders.length === 1 ? "" : "s"} nesta etapa
            </p>
          </div>

          <div className="orders-page__header-actions">
            <button
              className="orders-page__new-order-btn"
              onClick={() => navigate("/orders/create")}
            >
              Nova ordem
            </button>
          </div>
        </header>

        <section className="orders-page__admin-workbench orders-page__admin-workbench--client">
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
          <div className="orders-page__filter-tabs">
            <button
              className={`orders-page__filter-tab ${
                viewMode === "active" ? "active" : ""
              }`}
              onClick={() => setViewMode("active")}
            >
              Ativas ({counts.active})
            </button>
            <button
              className={`orders-page__filter-tab ${
                viewMode === "selection" ? "active" : ""
              }`}
              onClick={() => setViewMode("selection")}
            >
              Escolher prestador ({counts.selection})
            </button>
            <button
              className={`orders-page__filter-tab ${
                viewMode === "schedule" ? "active" : ""
              }`}
              onClick={() => setViewMode("schedule")}
            >
              Agendar ({counts.schedule})
            </button>
            <button
              className={`orders-page__filter-tab ${
                viewMode === "confirmation" ? "active" : ""
              }`}
              onClick={() => setViewMode("confirmation")}
            >
              Confirmar finalização ({counts.confirmation})
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
          <p className="orders-page__state">Carregando ordens...</p>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-page__empty">
            <p>
              {orders.length === 0
                ? "Você ainda não tem ordens cadastradas."
                : "Nenhuma ordem nesta etapa no momento."}
            </p>
            {orders.length === 0 && (
              <button
                type="button"
                className="orders-page__empty-btn"
                onClick={() => navigate("/orders/create")}
              >
                Criar primeira ordem
              </button>
            )}
          </div>
        ) : (
          <div className="orders-page__list">
            {visibleOrders.map((order) => {
              const pendingApplications =
                order.applications?.filter(
                  (application) => application.status === "PENDING",
                ) ?? [];
              const latestHistoryEvent =
                order.history?.[order.history.length - 1];
              const scheduleValue = getScheduleValue(order, scheduleValues);

              return (
                <article className="orders-flow-card orders-flow-card--client" key={order.id}>
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
                    {order.review && (
                      <span>
                        Avaliação: {order.review.rating}/5
                        {order.review.comment
                          ? ` - ${order.review.comment}`
                          : ""}
                      </span>
                    )}
                    {order.payment && (
                      <span>
                        Pagamento: {PAYMENT_STATUS_LABELS[order.payment.status]}
                      </span>
                    )}
                    {latestHistoryEvent && (
                      <span>Última atualização: {latestHistoryEvent.title}</span>
                    )}
                  </div>

                  {order.selectedProvider && (
                    <ProviderMiniCard provider={order.selectedProvider} />
                  )}

                  {pendingApplications.length > 0 && (
                    <div className="orders-flow-card__panel">
                      <h3>Candidatos para esta ordem</h3>
                      {pendingApplications.map((application) => (
                        <div
                          className="orders-flow-card__candidate"
                          key={application.id}
                        >
                          <div className="orders-flow-card__candidate-main">
                            <span className="orders-flow-card__provider-avatar">
                              {application.provider.photoUrl ? (
                                <img
                                  src={application.provider.photoUrl}
                                  alt=""
                                  loading="lazy"
                                />
                              ) : (
                                getProviderInitials(application.provider.name) || "P"
                              )}
                            </span>
                            <div className="orders-flow-card__candidate-copy">
                              <strong>{application.provider.name}</strong>
                              <div className="orders-flow-card__candidate-stats">
                                <span>
                                  ⭐ Nota{" "}
                                  <strong>
                                    {application.provider.ratingAverage.toFixed(1)}
                                  </strong>
                                </span>
                                <span>
                                  🧾 {application.provider.completedServices} serviços
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="orders-flow-card__actions">
                            <button
                              type="button"
                              onClick={() => {
                                void runAction(() =>
                                  acceptApplication(order.id, application.id),
                                );
                              }}
                            >
                              Aceitar
                            </button>
                            <button
                              type="button"
                              className="orders-flow-card__ghost"
                              onClick={() => {
                                void runAction(() =>
                                  rejectApplication(order.id, application.id),
                                );
                              }}
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {order.status === OrderStatus.AWAITING_SELECTION &&
                    pendingApplications.length === 0 && (
                      <div className="orders-flow-card__panel">
                        <h3>Seleção de prestador</h3>
                        <p className="orders-flow-card__hint">
                          Todas as candidaturas pendentes foram analisadas.
                        </p>
                      </div>
                    )}

                  {order.status === OrderStatus.PROVIDER_SELECTED && (
                    <div className="orders-flow-card__panel">
                      <h3>Agendamento oficial</h3>
                      <p className="orders-flow-card__hint">
                        Confirme a data e o horário combinados com o prestador.
                        Depois disso, a ordem fica indisponível para novas
                        candidaturas.
                      </p>
                      <label className="orders-flow-card__field">
                        Data e horário
                        <input
                          type="datetime-local"
                          min={minScheduleValue}
                          value={scheduleValue}
                          onChange={(event) =>
                            setScheduleValues((currentValues) => ({
                              ...currentValues,
                              [order.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        disabled={!scheduleValue}
                        onClick={() => {
                          void runAction(() =>
                            scheduleOrder(order.id, scheduleValue),
                          );
                        }}
                      >
                        Confirmar agendamento
                      </button>
                    </div>
                  )}

                  <div className="orders-flow-card__actions">
                    {order.status === OrderStatus.AWAITING_CONFIRMATION && (
                      <button
                        type="button"
                        onClick={() => handleConfirmFinished(order.id)}
                      >
                        Confirmar finalização
                      </button>
                    )}
                    {![
                      OrderStatus.FINISHED,
                      OrderStatus.CANCELLED,
                      OrderStatus.EXPIRED,
                      OrderStatus.AWAITING_CONFIRMATION,
                    ].includes(order.status) && (
                      <button
                        type="button"
                        className="orders-flow-card__ghost"
                        onClick={() => {
                          void runAction(() => cancelOrder(order.id));
                        }}
                      >
                        Cancelar ordem
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

                  {ratingOrderId === order.id && (
                    <form className="orders-flow-card__review">
                      <label>
                        Avaliação
                        <select
                          value={rating}
                          onChange={(event) =>
                            setRating(Number(event.target.value))
                          }
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option value={value} key={value}>
                              {value} estrela{value === 1 ? "" : "s"}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Comentário opcional
                        <textarea
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          placeholder="Conte como foi o atendimento"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          void runAction(async () => {
                            await confirmFinished(order.id, {
                              rating,
                              comment: comment.trim() || undefined,
                              reviewedAt: new Date().toISOString(),
                            });
                            setRatingOrderId(null);
                            setComment("");
                            setRating(5);
                          });
                        }}
                      >
                        Salvar avaliação
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
