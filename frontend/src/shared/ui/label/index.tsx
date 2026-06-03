import type { LabelHTMLAttributes, ReactNode } from "react";

import "./styles.css";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  required?: boolean;
};

export function Label({
  children,
  required = false,
  className,
  ...props
}: LabelProps) {
  const baseClass = "label";
  const finalClass = [baseClass, className].filter(Boolean).join(" ");

  return (
    <label className={finalClass} {...props}>
      {children}
      {required && <span className="label__required" aria-label="obrigatório">*</span>}
    </label>
  );
}