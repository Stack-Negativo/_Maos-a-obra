import type { Provider } from "../../types/order_types";

import "./application_card.css";

type ApplicationCardProps = {
  provider: Provider;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  onAccept?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
};

const STATUS_LABELS = {
  PENDING: "Pendente",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
};

const STATUS_COLORS = {
  PENDING: "pending",
  ACCEPTED: "success",
  REJECTED: "danger",
};

export function ApplicationCard({
  provider,
  status,
  onAccept,
  onReject,
  isLoading,
}: ApplicationCardProps) {
  const isInteractive = status === "PENDING";
  const statusLabel = STATUS_LABELS[status];
  const statusColorClass = STATUS_COLORS[status];

  return (
    <article className="application-card">
      <div className="application-card__header">
        <div className="application-card__provider">
          <strong className="application-card__name">
            {provider.name}
          </strong>
          <span className="application-card__rating">
            ⭐ {provider.ratingAverage.toFixed(1)} ({provider.completedServices} serviços)
          </span>
        </div>
        <span
          className={`application-card__status application-card__status--${statusColorClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {provider.bio && (
        <p className="application-card__bio">{provider.bio}</p>
      )}

      <div className="application-card__specialties">
        {provider.specialties.map((specialty) => (
          <span
            key={specialty.id}
            className="application-card__specialty-tag"
          >
            {specialty.name}
          </span>
        ))}
      </div>

      {isInteractive && (
        <div className="application-card__actions">
          <button
            className="application-card__btn application-card__btn--accept"
            onClick={onAccept}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "✓ Aceitar"}
          </button>
          <button
            className="application-card__btn application-card__btn--reject"
            onClick={onReject}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "✕ Recusar"}
          </button>
        </div>
      )}
    </article>
  );
}
