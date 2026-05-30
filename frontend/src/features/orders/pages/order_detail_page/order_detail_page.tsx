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
import type { Order, Provider } from "../../types/order_types";

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
  CANCELLED: "Cancelada",
} as const;

type OrderChatMessage = {
  id: string;
  authorName: string;
  authorRole: "CLIENT" | "PROVIDER" | "ADMIN" | "SYSTEM";
  body: string;
  createdAt: string;
};

const CHAT_STORAGE_PREFIX = "maos_a_obra_order_chat_v1:";

function getProviderInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function createInitialChat(order: Order): OrderChatMessage[] {
  const messages: OrderChatMessage[] = [
    {
      id: `${order.id}-system-chat`,
      authorName: "Mãos à Obra",
      authorRole: "SYSTEM",
      body: "Chat da ordem criado para centralizar alinhamentos, horários e combinados.",
      createdAt: order.createdAt,
    },
  ];

  if (order.selectedProvider) {
    messages.push({
      id: `${order.id}-provider-chat`,
      authorName: order.selectedProvider.name,
      authorRole: "PROVIDER",
      body: `Olá, vou acompanhar a ordem "${order.title}". Podemos alinhar detalhes por aqui.`,
      createdAt: order.updatedAt,
    });
  }

  return messages;
}

function readOrderChat(order: Order) {
  const stored = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${order.id}`);
  if (!stored) {
    return createInitialChat(order);
  }

  try {
    return JSON.parse(stored) as OrderChatMessage[];
  } catch {
    return createInitialChat(order);
  }
}

function writeOrderChat(orderId: string, messages: OrderChatMessage[]) {
  localStorage.setItem(`${CHAT_STORAGE_PREFIX}${orderId}`, JSON.stringify(messages));
}

function getRoleLabel(role: OrderChatMessage["authorRole"]) {
  const labels = {
    ADMIN: "Admin",
    CLIENT: "Cliente",
    PROVIDER: "Prestador",
    SYSTEM: "Sistema",
  };

  return labels[role];
}

function ProviderPhoto({ provider }: { provider: Provider }) {
  return (
    <span className="order-detail-page__provider-photo">
      {provider.photoUrl ? (
        <img src={provider.photoUrl} alt="" loading="lazy" />
      ) : (
        getProviderInitials(provider.name) || "P"
      )}
    </span>
  );
}

function getActionErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir esta ação agora.";
}

function formatHistoryActor(actor: string) {
  const labels: Record<string, string> = {
    ADMIN: "Admin",
    CLIENT: "Cliente",
    PROVIDER: "Prestador",
    SYSTEM: "Sistema",
  };

  return labels[actor] ?? actor;
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const orderSource =
    user?.role === UserRole.CLIENT
      ? "client"
      : user?.role === UserRole.PROVIDER
        ? "provider"
        : "admin";
  const [scheduleValue, setScheduleValue] = useState("");
  const [detailRating, setDetailRating] = useState(5);
  const [detailComment, setDetailComment] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [chatState, setChatState] = useState<{
    orderId: string | null;
    messages: OrderChatMessage[];
  }>({
    orderId: null,
    messages: [],
  });
  const [chatDraft, setChatDraft] = useState("");
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
  const chatMessages =
    chatState.orderId === order.id ? chatState.messages : readOrderChat(order);
  const selectedScheduleValue =
    scheduleValue ||
    toDateTimeLocalValue(order.scheduledAt ?? order.preferredDate);
  const minScheduleValue = toDateTimeLocalValue(new Date().toISOString());
  const isClient = user?.role === UserRole.CLIENT;
  const isProvider = user?.role === UserRole.PROVIDER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const selectedProviderId = order.selectedProvider?.id;
  const currentProviderId = user?.providerId ?? user?.id ?? "";
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

  const runOrderAction = async (action: () => Promise<void>) => {
    try {
      setActionError(null);
      await action();
    } catch (err) {
      setActionError(getActionErrorMessage(err));
    }
  };

  function sendChatMessage() {
    const body = chatDraft.trim();
    if (!body || !order) {
      return;
    }

    const authorRole =
      user?.role === UserRole.ADMIN
        ? "ADMIN"
        : user?.role === UserRole.PROVIDER
          ? "PROVIDER"
          : "CLIENT";
    const nextSequence = chatMessages.length + 1;
    const nextMessages = [
      ...chatMessages,
      {
        id: `${order.id}-chat-${nextSequence}`,
        authorName: user?.name ?? getRoleLabel(authorRole),
        authorRole,
        body,
        createdAt: new Date().toISOString(),
      } satisfies OrderChatMessage,
    ];

    setChatState({
      orderId: order.id,
      messages: nextMessages,
    });
    writeOrderChat(order.id, nextMessages);
    setChatDraft("");
  }

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
                  <div className="order-detail-page__provider-line">
                    <ProviderPhoto provider={order.selectedProvider} />
                    <p className="order-detail-page__info-value">
                      {order.selectedProvider.name} - nota{" "}
                      {order.selectedProvider.ratingAverage.toFixed(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="order-detail-page__section order-detail-page__section--timeline">
            <div className="order-detail-page__section-heading">
              <h2 className="order-detail-page__section-title">
                Linha do tempo
              </h2>
              <span>Acompanhe o andamento do atendimento</span>
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
                <span>A etapa muda conforme a ordem avança</span>
              </div>
              {actionError && (
                <div className="order-detail-page__action-error" role="alert">
                  {actionError}
                </div>
              )}
              <div className="orders-flow-card__actions">
                {(canClientSchedule || canAdminSchedule) && (
                  <div className="order-detail-page__schedule-form">
                    <label className="orders-flow-card__field">
                      Data e horário combinados
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
                        void runOrderAction(() =>
                          scheduleOrder(order.id, selectedScheduleValue),
                        )
                      }
                    >
                      Confirmar agendamento
                    </button>
                  </div>
                )}
                {(canProviderStart || canAdminStart) && (
                  <button
                    type="button"
                    onClick={() =>
                      void runOrderAction(() => startOrder(order.id))
                    }
                  >
                    Iniciar atendimento
                  </button>
                )}
                {(canProviderFinish || canAdminFinish) && (
                  <button
                    type="button"
                    onClick={() =>
                      void runOrderAction(() => finishOrder(order.id))
                    }
                  >
                    Encerrar atendimento
                  </button>
                )}
                {canAdminConfirm && (
                  <button
                    type="button"
                    onClick={() =>
                      void runOrderAction(() => confirmFinished(order.id))
                    }
                  >
                    Confirmar conclusão
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    className="orders-flow-card__ghost"
                    onClick={() =>
                      void runOrderAction(() =>
                        cancelOrder(
                          order.id,
                          "Cancelamento solicitado.",
                          isAdmin ? "ADMIN" : "CLIENT",
                        ),
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
                      void runOrderAction(async () => {
                        await confirmFinished(order.id, {
                          rating: detailRating,
                          comment: detailComment.trim() || undefined,
                          reviewedAt: new Date().toISOString(),
                        });
                        setDetailRating(5);
                        setDetailComment("");
                      });
                    }}
                  >
                    Confirmar conclusão
                  </button>
                </form>
              )}
            </section>
          )}

          <section className="order-detail-page__section order-detail-page__section--chat">
            <div className="order-detail-page__section-heading">
              <h2 className="order-detail-page__section-title">
                Chat da ordem
              </h2>
              <span>Mensagens salvas nesta demonstração</span>
            </div>

            <div className="order-detail-page__chat-list">
              {chatMessages.map((message) => (
                <article
                  className={`order-detail-page__chat-message order-detail-page__chat-message--${message.authorRole.toLowerCase()}`}
                  key={message.id}
                >
                  <div className="order-detail-page__chat-meta">
                    <strong>{message.authorName}</strong>
                    <span>
                      {getRoleLabel(message.authorRole)} -{" "}
                      {formatDateTime(message.createdAt)}
                    </span>
                  </div>
                  <p>{message.body}</p>
                </article>
              ))}
            </div>

            <form
              className="order-detail-page__chat-form"
              onSubmit={(event) => {
                event.preventDefault();
                sendChatMessage();
              }}
            >
              <textarea
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Escreva uma mensagem para alinhar detalhes da ordem"
              />
              <button type="submit" disabled={!chatDraft.trim()}>
                Enviar mensagem
              </button>
            </form>
          </section>

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
                Atualizações da ordem
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
                      {formatHistoryActor(event.actor)} -{" "}
                      {formatDateTime(event.createdAt)}
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
                      <div className="order-detail-page__candidate-main">
                        <ProviderPhoto provider={application.provider} />
                        <div>
                          <strong>{application.provider.name}</strong>
                          <span>
                            {APPLICATION_STATUS_LABELS[application.status]} · nota{" "}
                            {application.provider.ratingAverage.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      {(isClient || isAdmin) &&
                        application.status === "PENDING" && (
                          <div className="orders-flow-card__actions">
                            <button
                              type="button"
                              onClick={() =>
                                void runOrderAction(() =>
                                  acceptApplication(order.id, application.id),
                                )
                              }
                            >
                              Aceitar
                            </button>
                            <button
                              type="button"
                              className="orders-flow-card__ghost"
                              onClick={() =>
                                void runOrderAction(() =>
                                  rejectApplication(order.id, application.id),
                                )
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
