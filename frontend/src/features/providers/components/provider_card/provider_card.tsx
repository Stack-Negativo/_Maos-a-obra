import type { ProviderProfile } from "../../types/provider_types";

import "./provider_card.css";

type ProviderCardProps = {
  provider: ProviderProfile;
  canManage?: boolean;
  isUpdating?: boolean;
  onSuspend?: (providerId: string) => void;
  onUnsuspend?: (providerId: string) => void;
};

export function ProviderCard({
  provider,
  canManage = false,
  isUpdating = false,
  onSuspend,
  onUnsuspend,
}: ProviderCardProps) {
  const initials = provider.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <article className="provider-card">
      <div className="provider-card__top">
        <div className="provider-card__identity">
          <span className="provider-card__avatar">
            {provider.photoUrl ? (
              <img src={provider.photoUrl} alt="" loading="lazy" />
            ) : (
              initials || "P"
            )}
          </span>
          <div>
            <strong>{provider.name}</strong>
            <p>{provider.bio}</p>
          </div>
        </div>
        <span
          className={
            provider.isSuspended
              ? "provider-card__status provider-card__status--suspended"
              : "provider-card__status"
          }
        >
          {provider.isSuspended ? "Suspenso" : "Ativo"}
        </span>
      </div>

      <div className="provider-card__specialties">
        {provider.specialties.map((specialty) => (
          <span key={specialty.id}>
            {specialty.name}
          </span>
        ))}
      </div>

      <div className="provider-card__meta">
        <span>
          Nota <strong>{provider.ratingAverage.toFixed(1)}</strong>
        </span>
        <span>
          Serviços <strong>{provider.completedServices}</strong>
        </span>
      </div>

      {canManage && (
        <div className="provider-card__actions">
          {provider.isSuspended ? (
            <button
              type="button"
              onClick={() => onUnsuspend?.(provider.id)}
              disabled={isUpdating}
            >
              {isUpdating ? "Reativando..." : "Reativar prestador"}
            </button>
          ) : (
            <button
              type="button"
              className="provider-card__danger"
              onClick={() => onSuspend?.(provider.id)}
              disabled={isUpdating}
            >
              {isUpdating ? "Suspendendo..." : "Suspender prestador"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
