import { Link } from "react-router-dom";

import type {
  Order,
  OrderStatus,
} from "../../types/order_types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../../types/order_types";

import "./order_card.css";

type OrderCardProps = {
  order: Order;
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

export function OrderCard({ order }: OrderCardProps) {
  const statusLabel = ORDER_STATUS_LABELS[order.status];
  const statusColor = ORDER_STATUS_COLORS[order.status];
  const badgeColorClass = STATUS_BADGE_COLORS[statusColor] || "info";

  return (
    <article className="order-card">
      <div className="order-card__header">
        <div className="order-card__title-group">
          <h3 className="order-card__title">{order.title}</h3>
          <span
            className={`order-card__badge order-card__badge--${badgeColorClass}`}
          >
            {statusLabel}
          </span>
        </div>
        <time className="order-card__date">
          {new Date(order.createdAt).toLocaleDateString(
            "pt-BR",
          )}
        </time>
      </div>

      <p className="order-card__description">
        {order.description}
      </p>

      <div className="order-card__meta">
        <span className="order-card__meta-item">
          <span className="order-card__meta-icon">🏷️</span>
          {order.specialty.name}
        </span>
        <span className="order-card__meta-item">
          <span className="order-card__meta-icon">📍</span>
          {order.address.city}, {order.address.state}
        </span>
        {order.selectedProvider && (
          <span className="order-card__meta-item">
            <span className="order-card__meta-icon">👤</span>
            {order.selectedProvider.name}
          </span>
        )}
      </div>

      <div className="order-card__footer">
        <Link
          to={`/orders/${order.id}`}
          className="order-card__link"
        >
          Ver detalhes →
        </Link>
      </div>
    </article>
  );
}
