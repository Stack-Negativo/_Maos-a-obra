import type { Specialty } from "@/features/specialties/types/specialty_types";

import "./specialty_card.css";

type SpecialtyCardProps = {
  specialty: Specialty;
  onToggle?: () => void;
};

export function SpecialtyCard({ specialty, onToggle }: SpecialtyCardProps) {
  return (
    <article className="specialty-card">
      <div className="specialty-card__header">
        <strong>{specialty.name}</strong>
        <span className={specialty.isActive ? undefined : "inactive"}>
          {specialty.isActive ? "Ativa" : "Inativa"}
        </span>
      </div>
      <p>{specialty.description || "Sem descrição cadastrada."}</p>
      {onToggle && (
        <button type="button" onClick={onToggle}>
          {specialty.isActive ? "Inativar" : "Ativar"}
        </button>
      )}
    </article>
  );
}
