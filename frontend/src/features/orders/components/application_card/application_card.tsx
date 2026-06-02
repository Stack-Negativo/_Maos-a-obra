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

function getProviderInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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
          <span className="application-card__avatar">
            {provider.photoUrl ? (
              <img src={provider.photoUrl} alt="" loading="lazy" />
            ) : (
              getProviderInitials(provider.name) || "P"
            )}
          </span>
          <div className="application-card__provider-copy">
            <strong className="application-card__name">
              {provider.name}
            </strong>
            <div className="application-card__rating">
              <span>
                ⭐ Nota <strong>{provider.ratingAverage.toFixed(1)}</strong>
              </span>
              <span>🧾 {provider.completedServices} serviços</span>
            </div>
          </div>
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
            {isLoading ? "Processando..." : "Aceitar"}
          </button>
          <button
            className="application-card__btn application-card__btn--reject"
            onClick={onReject}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Recusar"}
          </button>
        </div>
      )}
    </article>
  );
}
