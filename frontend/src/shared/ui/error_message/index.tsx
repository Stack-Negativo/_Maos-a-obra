import type { ReactNode } from "react";

import "./styles.css";

type ErrorMessageProps = {
  children: ReactNode;
  id?: string;
};

export function ErrorMessage({ children, id }: ErrorMessageProps) {
  return (
    <p className="error-message" id={id} role="alert">
      <span className="error-message__icon" aria-hidden="true">⚠</span>
      <span>{children}</span>
    </p>
  );
}
