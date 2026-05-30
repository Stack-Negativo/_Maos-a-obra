import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Order } from "../types/order_types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../types/order_types";
import { orderService } from "../services/order_service";

import "./orders_card/orders_card.css";

type OrdersCardProps = {
  order: Order;
  onRefresh?: () => void;
};

const STATUS_BADGE_COLORS: Record<
  string,
  "success" | "warning" | "info" | "danger"
> = {
  success: "success",
  warning: "warning",
  info: "info",
  danger: "danger",
};

function getProviderInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function OrdersCard({
  order,
  onRefresh,
}: OrdersCardProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = ORDER_STATUS_LABELS[order.status];
  const statusColor = ORDER_STATUS_COLORS[order.status];
  const badgeColorClass =
    STATUS_BADGE_COLORS[statusColor] || "info";

  const canCancel =
    order.status === "CREATED" ||
    order.status === "PROVIDER_SELECTED";

  const handleCancel = async (
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    if (
      !window.confirm(
        "Tem certeza que deseja cancelar esta ordem?",
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await orderService.cancelOrder(order.id);
      onRefresh?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao cancelar ordem",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = () => {
    navigate(`/orders/${order.id}`);
  };

  const preferredDate = new Date(order.preferredDate);
  const createdDate = new Date(order.createdAt);
  const daysRemaining = Math.ceil(
    (preferredDate.getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <article className="orders-card">
      <div className="orders-card__header">
        <div className="orders-card__title-group">
          <h3 className="orders-card__title">{order.title}</h3>
          <span
            className={`orders-card__badge orders-card__badge--${badgeColorClass}`}
          >
            {statusLabel}
          </span>
        </div>
        <time className="orders-card__date">
          {createdDate.toLocaleDateString("pt-BR")}
        </time>
      </div>

      <p className="orders-card__description">
        {order.description}
      </p>

      <div className="orders-card__meta">
        <span className="orders-card__meta-item">
          <span className="orders-card__meta-label">Especialidade</span>
          {order.specialty.name}
        </span>
        <span className="orders-card__meta-item">
          <span className="orders-card__meta-label">Local</span>
          {order.address.street}, {order.address.number} -{" "}
          {order.address.city}, {order.address.state}
        </span>
        <span className="orders-card__meta-item">
          <span className="orders-card__meta-label">Prazo</span>
          {preferredDate.toLocaleDateString("pt-BR")} (
          {daysRemaining > 0
            ? `em ${daysRemaining} dias`
            : daysRemaining === 0
              ? "hoje"
              : `vencida há ${Math.abs(daysRemaining)} dias`}
          )
        </span>
        {order.selectedProvider && (
          <span className="orders-card__meta-item orders-card__meta-item--provider">
            <span className="orders-card__provider-avatar">
              {order.selectedProvider.photoUrl ? (
                <img src={order.selectedProvider.photoUrl} alt="" loading="lazy" />
              ) : (
                getProviderInitials(order.selectedProvider.name) || "P"
              )}
            </span>
            <strong>{order.selectedProvider.name}</strong>
            <span className="orders-card__rating">
              Nota {order.selectedProvider.ratingAverage.toFixed(1)}
            </span>
          </span>
        )}
      </div>

      {error && (
        <div className="orders-card__error" role="alert">
          {error}
        </div>
      )}

      <div className="orders-card__footer">
        <button
          className="orders-card__btn orders-card__btn--primary"
          onClick={handleViewDetails}
          disabled={isLoading}
        >
          Ver detalhes
        </button>
        {canCancel && (
          <button
            className="orders-card__btn orders-card__btn--danger"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? "Cancelando..." : "Cancelar ordem"}
          </button>
        )}
      </div>
    </article>
  );
}
