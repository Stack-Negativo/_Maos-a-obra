import type { ReactNode } from "react";

import "./styles.css";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "highlight" | "compact";
  onClick?: () => void;
};

export function Card({
  children,
  className,
  variant = "default",
  onClick,
}: CardProps) {
  const baseClass = "card";
  const variantClass =
    variant !== "default" ? `card--${variant}` : "";
  const finalClass = [baseClass, variantClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={finalClass} onClick={onClick}>
      {children}
    </div>
  );
}