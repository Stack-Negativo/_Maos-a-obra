import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../../types/order_types";
import { useProviderOrders } from "../../hooks/use_provider_orders";
import { useAuthContext } from "@/app/providers/auth_provider/use_auth_context";
import { AppShell } from "@/shared/components";

import "./orders_provider_page.css";

const STATUS_FILTER_OPTIONS = [
  { value: "CREATED", label: "ðŸ†• Criadas", emoji: "ðŸ†•" },
  {
    value: "PROVIDER_SELECTED",
    label: "âœ… Com Prestador",
    emoji: "âœ…",
  },
  { value: "SCHEDULED", label: "âš™ï¸ Agendadas", emoji: "âš™ï¸" },
  {
    value: "IN_PROGRESS",
    label: "âš¡ Em Andamento",
    emoji: "âš¡",
  },
  {
    value: "AWAITING_CONFIRMATION",
    label: "ðŸ‘€ Aguardando",
    emoji: "ðŸ‘€",
  },
  { value: "FINISHED", label: "ðŸ HistÃ³rico", emoji: "ðŸ" },
];

export function OrdersProviderPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { orders, loading, error, applyForOrder } = useProviderOrders();

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingOrderId, setApplyingOrderId] =
    useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"available" | "mine" | "assigned">(
    "available",
  );

  const filteredOrders = useMemo(() => {
    let result = orders.slice();

    // Filter by view mode
    if (viewMode === "available") {
      result = result.filter((order) =>
        selectedStatus === "SCHEDULED"
          ? order.status === "SCHEDULED"
          : order.status === "CREATED" || order.status === "PROVIDER_SELECTED",
      );
    } else if (viewMode === "mine") {
      result = result.filter((order) =>
        order.applications?.some(
          (app) => app.provider.id === String(user?.id),
        ) ?? false,
      );
    } else if (viewMode === "assigned") {
      result = result.filter(
        (order) => order.selectedProvider?.id === String(user?.id),
      );
    }

    if (!selectedStatus) {
      result = result.filter((order) => order.status !== "FINISHED");
    }
 
    if (selectedStatus) {
      result = result.filter((order) => order.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((order) =>
        order.title.toLowerCase().includes(query) ||
        order.description.toLowerCase().includes(query) ||
        order.specialty.name.toLowerCase().includes(query),
      );
    }

    return result;
  }, [orders, selectedStatus, searchQuery, viewMode, user]);

  const handleCandidature = async (orderId: string) => {
    if (!user || !user.isProvider) {
      alert("Você precisa ser um prestador para se candidatar");
      return;
    }

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.status !== "CREATED") {
      alert("Somente ordens criadas podem receber candidaturas.");
      return;
    }

    try {
      setApplyingOrderId(orderId);
      await applyForOrder(orderId);
      alert("✓ Candidatura enviada com sucesso!");
    } catch (error) {
      alert(
        `Erro ao se candidatar: ${
          error instanceof Error ? error.message : "Tente novamente"
        }`,
      );
    } finally {
      setApplyingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="orders-provider-page">
        <div className="orders-provider-page__loading">
          <p>Carregando ordens disponíveis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-provider-page">
        <div className="orders-provider-page__error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const totalOrders = orders.length;
  const availableOrdersCount = orders.filter(
    (order) => order.status === "CREATED" || order.status === "PROVIDER_SELECTED",
  ).length;

  const visibleViewLabel =
    viewMode === "available"
      ? "DisponÃ­veis"
      : viewMode === "mine"
      ? "Minhas candidaturas"
      : "Vinculadas a mim";

  return (
    <AppShell>
      <section className="orders-provider-page">
        <header className="orders-provider-page__header">
          <div className="orders-provider-page__header-copy">
            <span className="orders-provider-page__eyebrow">
              Painel de Prestador
            </span>
            <h1 className="orders-provider-page__title">
              Ordens disponÃ­veis
            </h1>
            <p className="orders-provider-page__subtitle">
              Veja ordens que combinam com suas especialidades e envie sua proposta com seguranÃ§a.
            </p>
          </div>

          <div className="orders-provider-page__header-actions">
            <div className="orders-provider-page__stats-grid">
              <div className="orders-provider-page__stat-card">
                <span className="orders-provider-page__stat-label">
                  Ordens totais
                </span>
                <strong>{totalOrders}</strong>
              </div>
              <div className="orders-provider-page__stat-card">
                <span className="orders-provider-page__stat-label">
                  DisponÃ­veis
                </span>
                <strong>{availableOrdersCount}</strong>
              </div>
              <div className="orders-provider-page__stat-card">
                <span className="orders-provider-page__stat-label">
                  VisÃ£o atual
                </span>
                <strong>{visibleViewLabel}</strong>
              </div>
            </div>
          </div>
        </header>

        <div className="orders-provider-page__filter-panel">
          <input
            type="text"
            placeholder="ðŸ” Buscar por tÃ­tulo, especialidade ou local"
            className="orders-provider-page__search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="orders-provider-page__filter-row">
            <div className="orders-provider-page__view-tabs">
              <button
                className={`view-tab ${viewMode === "available" ? "view-tab--active" : ""}`}
                onClick={() => setViewMode("available")}
              >
                DisponÃ­veis
              </button>
              <button
                className={`view-tab ${viewMode === "mine" ? "view-tab--active" : ""}`}
                onClick={() => setViewMode("mine")}
              >
                Minhas candidaturas
              </button>
              <button
                className={`view-tab ${viewMode === "assigned" ? "view-tab--active" : ""}`}
                onClick={() => setViewMode("assigned")}
              >
                Vinculadas a mim
              </button>
            </div>

            <div className="orders-provider-page__status-filters">
              <button
                className={`status-filter-btn ${!selectedStatus ? "status-filter-btn--active" : ""}`}
                onClick={() => setSelectedStatus(null)}
              >
                ðŸ“‹ Todas
              </button>
              {STATUS_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`status-filter-btn ${selectedStatus === option.value ? "status-filter-btn--active" : ""}`}
                  onClick={() => setSelectedStatus(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      {filteredOrders.length === 0 ? (
        <div className="orders-provider-page__empty">
          <p>Nenhuma ordem encontrada</p>
          <small>
            {selectedStatus
              ? `Tente mudar o filtro de status`
              : `Tente buscar por tÃ­tulo ou especialidade`}
          </small>
        </div>
      ) : (
        <div className="orders-provider-page__list">
          {filteredOrders.map((order) => {
            const statusColor =
              ORDER_STATUS_COLORS[order.status];
            const isCandidated =
              order.applications?.some(
                (app) =>
                  app.provider.id === String(user?.id) &&
                  app.status === "PENDING",
              ) ?? false;

            return (
              <div
                key={order.id}
                className="provider-order-card"
              >
                <div className="provider-order-card__header">
                  <div className="provider-order-card__title-section">
                    <h3 className="provider-order-card__title">
                      {order.title}
                    </h3>
                    <span
                      className={`provider-order-card__status badge badge--${statusColor}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="provider-order-card__specialty">
                    ðŸ·ï¸ {order.specialty.name}
                  </p>
                </div>

                <div className="provider-order-card__body">
                  <p className="provider-order-card__description">
                    {order.description}
                  </p>

                  <div className="provider-order-card__details">
                    <div className="detail-item">
                      <span className="detail-label">
                        ðŸ“ Local:
                      </span>
                      <span className="detail-value">
                        {order.address.neighborhood},{" "}
                        {order.address.city}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        ðŸ“… Data preferida:
                      </span>
                      <span className="detail-value">
                        {new Date(
                          order.preferredDate,
                        ).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        ðŸ‘¥ Candidatos:
                      </span>
                      <span className="detail-value">
                        {order.applications?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="provider-order-card__footer">
                  <button
                    className="btn btn--secondary"
                    onClick={() =>
                      navigate(`/orders/${order.id}`)
                    }
                  >
                    ðŸ‘ï¸ Ver Detalhes
                  </button>
                  <div className="provider-order-card__action">
                    <button
                      className={`btn btn--candidature ${
                        isCandidated
                          ? "btn--candidature--applied"
                          : ""
                      }`}
                      onClick={() =>
                        handleCandidature(order.id)
                      }
                      disabled={
                        applyingOrderId === order.id ||
                        isCandidated ||
                        order.status !== "CREATED"
                      }
                      title={
                        order.status !== "CREATED"
                          ? "Somente ordens criadas aceitam candidaturas"
                          : isCandidated
                          ? "Você já se candidatou"
                          : "Clique para se candidatar"
                      }
                    >
                      {isCandidated
                        ? "✓ Candidatado"
                        : order.status !== "CREATED"
                        ? "Indisponível"
                        : "ðŸš€ Se Candidatar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </section>
    </AppShell>
  );
}
