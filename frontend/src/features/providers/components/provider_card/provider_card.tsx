import type { ProviderProfile } from "../../types/provider_types";

import "./provider_card.css";

type ProviderCardProps = {
  provider: ProviderProfile;
};

export function ProviderCard({
  provider,
}: ProviderCardProps) {
  return (
    <article className="provider-card">
      <div className="provider-card__top">
        <div>
          <strong>{provider.name}</strong>
          <p>{provider.bio}</p>
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
          Servicos <strong>{provider.completedServices}</strong>
        </span>
      </div>
    </article>
  );
}
