import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider";
import { UserRole } from "@/features/auth/types/auth_types";
import { AppShell } from "@/shared/components";

import { useOrdersMutations } from "../../hooks";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  OrderStatus,
} from "../../types/order_types";

import "./order_detail_page.css";

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

function formatDateTime(value?: string) {
  if (!value) {
    return "Pendente";
  }

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const APPLICATION_STATUS_LABELS = {
  PENDING: "Pendente",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
} as const;

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const orderSource =
    user?.role === UserRole.CLIENT
      ? "client"
      : user?.role === UserRole.PROVIDER
        ? "provider"
        : user?.role === UserRole.ADMIN
          ? "admin"
          : "mock";
  const [scheduleValue, setScheduleValue] = useState("");
  const [detailRating, setDetailRating] = useState(5);
  const [detailComment, setDetailComment] = useState("");
  const {
    getOrderById,
    acceptApplication,
    rejectApplication,
    scheduleOrder,
    startOrder,
    finishOrder,
    confirmFinished,
    cancelOrder,
    refreshOrderById,
  } = useOrdersMutations(undefined, orderSource);

  const order = id ? getOrderById(id) : null;

  useEffect(() => {
    if (id) {
      void refreshOrderById(id);
    }
  }, [id, refreshOrderById]);

  if (!order) {
    return (
      <AppShell>
        <div className="order-detail-page">
          <div className="order-detail-page__error">
            <h2>Ordem não encontrada</h2>
            <button
              onClick={() => navigate("/orders")}
              className="order-detail-page__back-btn"
            >
              Voltar para ordens
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const applications = order.applications ?? [];
  const selectedScheduleValue =
    scheduleValue ||
    toDateTimeLocalValue(order.scheduledAt ?? order.preferredDate);
  const minScheduleValue = toDateTimeLocalValue(new Date().toISOString());
  const isClient = user?.role === UserRole.CLIENT;
  const isProvider = user?.role === UserRole.PROVIDER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const selectedProviderId = order.selectedProvider?.id;
  const currentProviderId = user?.providerId ?? user?.id ?? "mock-provider";
  const canClientSchedule =
    isClient && order.status === OrderStatus.PROVIDER_SELECTED;
  const canProviderStart =
    isProvider &&
    selectedProviderId === currentProviderId &&
    order.status === OrderStatus.SCHEDULED;
  const canProviderFinish =
    isProvider &&
    selectedProviderId === currentProviderId &&
    order.status === OrderStatus.IN_PROGRESS;
  const canClientConfirm =
    isClient && order.status === OrderStatus.AWAITING_CONFIRMATION;
  const canAdminSchedule =
    isAdmin && order.status === OrderStatus.PROVIDER_SELECTED;
  const canAdminStart = isAdmin && order.status === OrderStatus.SCHEDULED;
  const canAdminFinish = isAdmin && order.status === OrderStatus.IN_PROGRESS;
  const canAdminConfirm =
    isAdmin && order.status === OrderStatus.AWAITING_CONFIRMATION;
  const canCancel =
    (isClient || isAdmin) &&
    ![
      OrderStatus.FINISHED,
      OrderStatus.CANCELLED,
      OrderStatus.EXPIRED,
      OrderStatus.AWAITING_CONFIRMATION,
    ].includes(order.status);
  const showFlowActions =
    canClientSchedule ||
    canProviderStart ||
    canProviderFinish ||
    canClientConfirm ||
    canAdminSchedule ||
    canAdminStart ||
    canAdminFinish ||
    canAdminConfirm ||
    canCancel;
  const timelineItems = [
    {
      label: "Criação",
      date: order.createdAt,
      active: true,
    },
    {
      label: "Candidaturas",
      date: applications[0]?.appliedAt,
      active: applications.length > 0,
    },
    {
      label: "Prestador selecionado",
      date: applications.find((item) => item.status === "ACCEPTED")
        ?.respondedAt,
      active: Boolean(order.selectedProvider),
    },
    {
      label: "Agendamento",
      date: order.scheduledAt,
      active: Boolean(order.scheduledAt),
    },
    {
      label: "Início",
      date: order.startedAt,
      active: Boolean(order.startedAt),
    },
    {
      label: "Finalização pelo prestador",
      date: order.finishedAt,
      active: Boolean(order.finishedAt),
    },
    {
      label: "Confirmação e avaliação",
      date: order.review?.reviewedAt ?? order.updatedAt,
      active: order.status === OrderStatus.FINISHED,
    },
  ];
  const statusTone = ORDER_STATUS_COLORS[order.status];
  const pendingApplications = applications.filter(
    (application) => application.status === "PENDING",
  ).length;
  const localSummary = [
    order.address.street,
    order.address.number,
    order.address.neighborhood,
    order.address.city,
    order.address.state,
  ]
    .filter(Boolean)
    .join(", ");
  const detailStats = [
    {
      label: "Especialidade",
      value: order.specialty.name,
    },
    {
      label: "Candidaturas",
      value: `${applications.length}`,
    },
    {
      label: "Data preferida",
      value: formatDateTime(order.preferredDate),
    },
    {
      label: "Agendamento",
      value: formatDateTime(order.scheduledAt),
    },
  ];

  return (
    <AppShell>
      <div className="order-detail-page">
        <header className="order-detail-page__header">
          <button
            onClick={() => navigate("/orders")}
            className="order-detail-page__back-btn"
          >
            Voltar
          </button>

          <div className="order-detail-page__hero">
            <div className="order-detail-page__hero-copy">
              <span className="order-detail-page__eyebrow">
                Ordem de serviço
              </span>
              <h1 className="order-detail-page__title">{order.title}</h1>
              <p>{order.description}</p>
            </div>
            <div className="order-detail-page__hero-status">
              <span
                className={`order-detail-page__badge order-detail-page__badge--${statusTone}`}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              {pendingApplications > 0 && (
                <small>{pendingApplications} candidatura(s) para avaliar</small>
              )}
            </div>
          </div>
        </header>

        <div className="order-detail-page__container">
          <section className="order-detail-page__summary-grid">
            {detailStats.map((item) => (
              <article
                className="order-detail-page__summary-card"
                key={item.label}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </section>

          <section className="order-detail-page__section order-detail-page__section--details">
            <div className="order-detail-page__section-heading">
              <h2 className="order-detail-page__section-title">
                Dados da ordem
              </h2>
              <span>Criada em {formatDateTime(order.createdAt)}</span>
            </div>
            <div className="order-detail-page__info-grid">
              <div className="order-detail-page__info-item">
                <label className="order-detail-page__info-label">
                  Local do atendimento
                </label>
                <p className="order-detail-page__info-value">
                  {localSummary}
                  {order.address.complement && (
                    <>
                      <br />
                      {order.address.complement}
                    </>
                  )}
                </p>
              </div>
              <div className="order-detail-page__info-item">
                <label className="order-detail-page__info-label">CEP</label>
                <p className="order-detail-page__info-value">
                  {order.address.zipCode}
                </p>
              </div>
              {order.selectedProvider && (
                <div className="order-detail-page__info-item">
                  <label className="order-detail-page__info-label">
                    Prestador selecionado
                  </label>
                  <p className="order-detail-page__info-value">
                    {order.selectedProvider.name} - nota{" "}
                    {order.selectedProvider.ratingAverage.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="order-detail-page__section order-detail-page__section--timeline">
            <div className="order-detail-page__section-heading">
              <h2 className="order-detail-page__section-title">
                Linha do tempo
              </h2>
              <span>Fluxo completo da solicitação</span>
            </div>
            <ol className="order-detail-page__timeline">
              {timelineItems.map((item) => (
                <li
                  key={item.label}
                  className={
                    item.active
                      ? "order-detail-page__timeline-item order-detail-page__timeline-item--active"
                      : "order-detail-page__timeline-item"
                  }
                >
                  <span className="order-detail-page__timeline-dot" />
                  <div>
                    <strong>{item.label}</strong>
                    <small>{formatDateTime(item.date)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {showFlowActions && (
            <section className="order-detail-page__section order-detail-page__section--action">
              <div className="order-detail-page__section-heading">
                <h2 className="order-detail-page__section-title">
                  Próxima ação
                </h2>
                <span>Execute somente a etapa disponível neste status</span>
              </div>
              <div className="orders-flow-card__actions">
                {(canClientSchedule || canAdminSchedule) && (
                  <div className="order-detail-page__schedule-form">
                    <label className="orders-flow-card__field">
                      Data e horário oficiais
                      <input
                        type="datetime-local"
                        min={minScheduleValue}
                        value={selectedScheduleValue}
                        onChange={(event) =>
                          setScheduleValue(event.target.value)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!selectedScheduleValue}
                      onClick={() =>
                        scheduleOrder(order.id, selectedScheduleValue)
                      }
                    >
                      Confirmar agendamento
                    </button>
                  </div>
                )}
                {(canProviderStart || canAdminStart) && (
                  <button type="button" onClick={() => startOrder(order.id)}>
                    Iniciar serviço
                  </button>
                )}
                {(canProviderFinish || canAdminFinish) && (
                  <button type="button" onClick={() => finishOrder(order.id)}>
                    Encerrar atendimento
                  </button>
                )}
                {canAdminConfirm && (
                  <button
                    type="button"
                    onClick={() => confirmFinished(order.id)}
                  >
                    Confirmar que o serviço foi finalizado
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    className="orders-flow-card__ghost"
                    onClick={() =>
                      cancelOrder(
                        order.id,
                        "Cancelamento solicitado.",
                        isAdmin ? "ADMIN" : "CLIENT",
                      )
                    }
                  >
                    Cancelar ordem
                  </button>
                )}
              </div>
              {canClientConfirm && (
                <form className="orders-flow-card__review">
                  <label>
                    Avaliação
                    <select
                      value={detailRating}
                      onChange={(event) =>
                        setDetailRating(Number(event.target.value))
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
                      value={detailComment}
                      onChange={(event) => setDetailComment(event.target.value)}
                      placeholder="Conte como foi o atendimento"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      confirmFinished(order.id, {
                        rating: detailRating,
                        comment: detailComment.trim() || undefined,
                        reviewedAt: new Date().toISOString(),
                      });
                      setDetailRating(5);
                      setDetailComment("");
                    }}
                  >
                    Confirmar que o serviço foi finalizado
                  </button>
                </form>
              )}
            </section>
          )}

          {order.review && (
            <section className="order-detail-page__section">
              <h2 className="order-detail-page__section-title">Avaliação</h2>
              <p className="order-detail-page__info-value">
                Nota {order.review.rating}/5
                {order.review.comment ? ` - ${order.review.comment}` : ""}
              </p>
            </section>
          )}

          {order.history && order.history.length > 0 && (
            <section className="order-detail-page__section">
              <h2 className="order-detail-page__section-title">
                Histórico de auditoria
              </h2>
              <div className="order-detail-page__audit-list">
                {[...order.history].reverse().map((event) => (
                  <article
                    className="order-detail-page__audit-item"
                    key={event.id}
                  >
                    <div>
                      <strong>{event.title}</strong>
                      {event.description && <p>{event.description}</p>}
                    </div>
                    <span>
                      {event.actor} · {formatDateTime(event.createdAt)}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {order.payment && (
            <section className="order-detail-page__section">
              <h2 className="order-detail-page__section-title">Pagamento</h2>
              <div className="order-detail-page__info-grid">
                <div className="order-detail-page__info-item">
                  <label className="order-detail-page__info-label">
                    Status
                  </label>
                  <p className="order-detail-page__info-value">
                    {PAYMENT_STATUS_LABELS[order.payment.status]}
                  </p>
                </div>
                <div className="order-detail-page__info-item">
                  <label className="order-detail-page__info-label">
                    Valor estimado
                  </label>
                  <p className="order-detail-page__info-value">
                    {order.payment.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
                <div className="order-detail-page__info-item">
                  <label className="order-detail-page__info-label">
                    Processado em
                  </label>
                  <p className="order-detail-page__info-value">
                    {formatDateTime(order.payment.processedAt)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {(isClient || isAdmin) && (
            <section className="order-detail-page__section">
              <div className="order-detail-page__section-heading">
                <h2 className="order-detail-page__section-title">
                  Candidaturas ({applications.length})
                </h2>
                <span>
                  {pendingApplications > 0
                    ? `${pendingApplications} aguardando decisão`
                    : "Sem pendências"}
                </span>
              </div>
              {applications.length === 0 ? (
                <p className="order-detail-page__info-value">
                  Ainda não há candidatos para esta ordem.
                </p>
              ) : (
                <div className="order-detail-page__applications">
                  {applications.map((application) => (
                    <div
                      className="orders-flow-card__candidate"
                      key={application.id}
                    >
                      <div>
                        <strong>{application.provider.name}</strong>
                        <span>
                          {APPLICATION_STATUS_LABELS[application.status]} · nota{" "}
                          {application.provider.ratingAverage.toFixed(1)}
                        </span>
                      </div>
                      {(isClient || isAdmin) &&
                        application.status === "PENDING" && (
                          <div className="orders-flow-card__actions">
                            <button
                              type="button"
                              onClick={() =>
                                acceptApplication(order.id, application.id)
                              }
                            >
                              Aceitar
                            </button>
                            <button
                              type="button"
                              className="orders-flow-card__ghost"
                              onClick={() =>
                                rejectApplication(order.id, application.id)
                              }
                            >
                              Recusar
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
