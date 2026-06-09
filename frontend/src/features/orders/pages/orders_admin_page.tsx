import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useProviders } from "@/features/providers/hooks/use_providers";
import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import { useOrdersMutations } from "../hooks";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  OrderStatus,
} from "../types/order_types";
import type { Order } from "../types/order_types";

import "./orders_page/orders_page.css";

function formatAddress(order: Order) {
  return `${order.address.street}, ${order.address.number ?? "s/n"} - ${order.address.neighborhood}, ${order.address.city}/${order.address.state}`;
}

function getPendingLabel(order: Order) {
  const hasPendingApplication = order.applications?.some(
    (application) => application.status === "PENDING",
  );

  if (hasPendingApplication) {
    return "Cliente precisa analisar candidatura";
  }

  if (order.status === OrderStatus.PROVIDER_SELECTED) {
    return "Cliente precisa confirmar agendamento";
  }

  if (order.status === OrderStatus.AWAITING_CONFIRMATION) {
    return "Cliente precisa confirmar finalização";
  }

  return "Sem pendências críticas";
}

export function OrdersAdminPage() {
  const { orders, loading, cancelOrder, expireOrder } = useOrdersMutations(
    undefined,
    "admin",
  );
  const {
    providers,
    totalProviders,
    activeProviders,
    suspendedProviders,
    loading: providersLoading,
    updatingProviderId,
    error: providersError,
    suspendProvider,
    unsuspendProvider,
    deleteProvider,
    refresh: refreshProviders,
  } = useProviders();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function runAction(action: () => Promise<void>) {
    setActionError(null);

    try {
      await action();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a ação administrativa.",
      );
    }
  }

  async function confirmDeleteProvider(providerId: string, providerName: string) {
    const confirmed = window.confirm(
      `Excluir o perfil de prestador de ${providerName}? Esta ação não remove o usuário e só será permitida se ele não estiver vinculado a ordens.`,
    );

    if (!confirmed) {
      return;
    }

    await deleteProvider(providerId);
  }

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) =>
          `${order.title} ${order.description} ${order.specialty.name} ${order.address.city} ${order.selectedProvider?.name ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .filter((order) =>
          filterStatus ? order.status === filterStatus : true,
        ),
    [orders, search, filterStatus],
  );

  const statuses = Object.values(OrderStatus);
  const activeOrders = orders.filter(
    (order) =>
      ![
        OrderStatus.FINISHED,
        OrderStatus.CANCELLED,
        OrderStatus.EXPIRED,
      ].includes(order.status),
  ).length;
  const pendingDecisions = orders.filter(
    (order) => order.status === OrderStatus.AWAITING_SELECTION,
  ).length;
  const inExecution = orders.filter((order) =>
    [
      OrderStatus.SCHEDULED,
      OrderStatus.IN_PROGRESS,
      OrderStatus.AWAITING_CONFIRMATION,
    ].includes(order.status),
  ).length;
  const finishedOrders = orders.filter(
    (order) => order.status === OrderStatus.FINISHED,
  ).length;
  const cancelledOrders = orders.filter(
    (order) => order.status === OrderStatus.CANCELLED,
  ).length;
  const awaitingSelectionOrders = orders.filter(
    (order) => order.status === OrderStatus.AWAITING_SELECTION,
  );
  const awaitingScheduleOrders = orders.filter(
    (order) => order.status === OrderStatus.PROVIDER_SELECTED,
  );
  const awaitingConfirmationOrders = orders.filter(
    (order) => order.status === OrderStatus.AWAITING_CONFIRMATION,
  );
  const adminNextAction =
    awaitingSelectionOrders.length > 0
      ? {
          icon: "👷",
          title: "Clientes precisam escolher",
          text: "Filtre ordens com candidaturas pendentes de decisão.",
          status: OrderStatus.AWAITING_SELECTION,
        }
      : awaitingScheduleOrders.length > 0
        ? {
            icon: "📅",
            title: "Agendamentos pendentes",
            text: "Acompanhe ordens com prestador aceito aguardando horário.",
            status: OrderStatus.PROVIDER_SELECTED,
          }
        : awaitingConfirmationOrders.length > 0
          ? {
              icon: "⭐",
              title: "Finalização pendente",
              text: "Veja atendimentos esperando confirmação do cliente.",
              status: OrderStatus.AWAITING_CONFIRMATION,
            }
          : {
              icon: "✅",
              title: "Operação estável",
              text: "O funil está sem bloqueios críticos no momento.",
              status: null,
            };

  return (
    <AppShell>
      <section className="orders-page">
        <header className="orders-page__header">
          <div>
            <span className="orders-page__eyebrow">Administração</span>
            <h1>Central administrativa</h1>
            <p>
              Acompanhe o funil inteiro de ordens, candidaturas,
              agendamentos, execução, pagamento e histórico finalizado.
            </p>
            <p className="orders-page__summary">
              {orders.length} ordem{orders.length === 1 ? "" : "s"} e{" "}
              {totalProviders} prestador{totalProviders === 1 ? "" : "es"} no
              sistema
            </p>
          </div>
          <div className="orders-page__header-actions orders-page__header-actions--client">
            <button
              type="button"
              className="orders-page__next-action orders-page__next-action--admin"
              onClick={() => setFilterStatus(adminNextAction.status)}
            >
              <span aria-hidden="true">{adminNextAction.icon}</span>
              <div>
                <strong>{adminNextAction.title}</strong>
                <small>{adminNextAction.text}</small>
              </div>
            </button>
          </div>
        </header>

        <section className="orders-page__admin-summary">
          <div>
            <span>Total</span>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <span>Ativas</span>
            <strong>{activeOrders}</strong>
          </div>
          <div>
            <span>Aguardando cliente</span>
            <strong>{pendingDecisions}</strong>
          </div>
          <div>
            <span>Em atendimento</span>
            <strong>{inExecution}</strong>
          </div>
          <div>
            <span>Finalizadas</span>
            <strong>{finishedOrders}</strong>
          </div>
          <div>
            <span>Canceladas</span>
            <strong>{cancelledOrders}</strong>
          </div>
          <div>
            <span>Prestadores</span>
            <strong>{providersLoading ? "..." : totalProviders}</strong>
          </div>
        </section>

        <section className="orders-page__provider-management">
          <div className="orders-page__provider-management-head">
            <div>
              <span className="orders-page__eyebrow">Gestão de prestadores</span>
              <h2>Suspender, reativar ou excluir acesso</h2>
              <p>
                Controle administrativo direto: prestadores suspensos deixam de
                participar do fluxo operacional até serem reativados. A exclusão
                remove apenas o perfil de prestador quando ele ainda não possui
                ordens vinculadas.
              </p>
            </div>
            <button
              type="button"
              className="orders-page__refresh-btn"
              onClick={() => {
                void refreshProviders();
              }}
              disabled={providersLoading}
            >
              {providersLoading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {providersError ? (
            <p className="orders-page__state">{providersError}</p>
          ) : providersLoading ? (
            <p className="orders-page__state">Carregando prestadores...</p>
          ) : providers.length === 0 ? (
            <p className="orders-page__state">Nenhum prestador encontrado.</p>
          ) : (
            <div className="orders-page__provider-management-list">
              {providers.map((provider) => (
                <article
                  className="orders-page__provider-management-row"
                  key={provider.id}
                >
                  <div>
                    <strong>{provider.name}</strong>
                    <span>
                      <small>{provider.isSuspended ? "Suspenso" : "Ativo"}</small>
                      <small>
                        {provider.specialties
                          .map((specialty) => specialty.name)
                          .join(", ") || "Sem especialidade"}
                      </small>
                    </span>
                  </div>

                  <div className="orders-page__provider-actions">
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
                          : "Reativar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="orders-page__provider-management-danger"
                        onClick={() => {
                          void suspendProvider(provider.id);
                        }}
                        disabled={updatingProviderId === provider.id}
                      >
                        {updatingProviderId === provider.id
                          ? "Suspendendo..."
                          : "Suspender"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="orders-page__provider-management-danger"
                      onClick={() => {
                        void confirmDeleteProvider(provider.id, provider.name);
                      }}
                      disabled={updatingProviderId === provider.id}
                    >
                      {updatingProviderId === provider.id
                        ? "Processando..."
                        : "Excluir perfil"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="orders-page__admin-actions">
          <Link to="/specialties">Gerir catálogo</Link>
          <Link to="/providers">Ver prestadores</Link>
          <Link to="/profile">Perfil administrativo</Link>
        </section>

        <section className="orders-page__admin-workbench">
          <article>
            <div>
              <span>Escolha de prestador</span>
              <strong>{awaitingSelectionOrders.length}</strong>
            </div>
            <p>Ordens com candidaturas aguardando decisão do cliente.</p>
          </article>
          <article>
            <div>
              <span>Agendamento</span>
              <strong>{awaitingScheduleOrders.length}</strong>
            </div>
            <p>Ordens com prestador aceito aguardando horário oficial.</p>
          </article>
          <article>
            <div>
              <span>Confirmação final</span>
              <strong>{awaitingConfirmationOrders.length}</strong>
            </div>
            <p>Atendimentos encerrados pelo prestador aguardando o cliente.</p>
          </article>
          <article>
            <div>
              <span>Rede de prestadores</span>
              <strong>{activeProviders}</strong>
            </div>
            <p>
              Perfis ativos aparecem aqui após cadastro direto ou ativação pelo
              botão “Quero me tornar prestador”.
              {suspendedProviders > 0
                ? ` ${suspendedProviders} suspenso(s).`
                : ""}
            </p>
          </article>
        </section>

        <section className="orders-page__filters">
          <Input
            placeholder="Buscar por título, cidade, especialidade ou prestador"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={loading}
            aria-label="Buscar ordens"
          />
          <div className="orders-page__filter-tabs">
            <button
              className={`orders-page__filter-tab ${
                filterStatus === null ? "active" : ""
              }`}
              onClick={() => setFilterStatus(null)}
            >
              Todas ({orders.length})
            </button>
            {statuses.map((status) => (
              <button
                key={status}
                className={`orders-page__filter-tab ${
                  filterStatus === status ? "active" : ""
                }`}
                onClick={() => setFilterStatus(status)}
              >
                {ORDER_STATUS_LABELS[status]} (
                {orders.filter((order) => order.status === status).length})
              </button>
            ))}
          </div>
        </section>

        {actionError && (
          <p className="orders-page__error" role="alert">
            {actionError}
          </p>
        )}

        {loading ? (
          <p className="orders-page__state">Carregando ordens...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-page__empty">
            <p>Nenhuma ordem encontrada.</p>
          </div>
        ) : (
          <div className="orders-page__list">
            {filteredOrders.map((order) => (
              <article
                className="orders-flow-card orders-flow-card--admin"
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
                  <span>{formatAddress(order)}</span>
                  <span>Candidatos: {order.applications?.length ?? 0}</span>
                  <span className="orders-flow-card__meta-pair">
                    <small>Prestador</small>
                    <strong>{order.selectedProvider?.name ?? "Não vinculado"}</strong>
                  </span>
                  <span>
                    Pendência: {getPendingLabel(order)}
                  </span>
                  <span>
                    Pagamento:{" "}
                    {order.payment
                      ? PAYMENT_STATUS_LABELS[order.payment.status]
                      : "não iniciado"}
                  </span>
                  <span>
                    Avaliação:{" "}
                    {order.review ? `${order.review.rating}/5` : "pendente"}
                  </span>
                </div>

                <div className="orders-flow-card__actions">
                  <Link
                    to={`/orders/${order.id}`}
                    className="orders-flow-card__link"
                  >
                    Ver detalhes
                  </Link>
                  {[
                    OrderStatus.CREATED,
                    OrderStatus.AWAITING_CANDIDATES,
                    OrderStatus.AWAITING_SELECTION,
                  ].includes(order.status) && (
                    <button
                      type="button"
                      className="orders-flow-card__ghost"
                      onClick={() => {
                        void runAction(() => expireOrder(order.id));
                      }}
                    >
                      Marcar como expirada
                    </button>
                  )}
                  {![
                    OrderStatus.FINISHED,
                    OrderStatus.CANCELLED,
                    OrderStatus.EXPIRED,
                  ].includes(order.status) && (
                    <button
                      type="button"
                      className="orders-flow-card__ghost"
                      onClick={() => {
                        void runAction(() =>
                          cancelOrder(
                            order.id,
                            "Cancelamento administrativo.",
                            "ADMIN",
                          ),
                        );
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
