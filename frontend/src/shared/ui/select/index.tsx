import type { SelectHTMLAttributes, ReactNode } from "react";

import { Label } from "../label";
import { ErrorMessage } from "../error_message";

import "./styles.css";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  label?: ReactNode;
  options: SelectOption[];
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export function Select({
  label,
  options,
  onChange,
  error,
  required = false,
  placeholder,
  id,
  className,
  ...props
}: SelectProps) {
  const errorId = error ? `${id}-error` : undefined;
  const baseClass = "select";
  const errorClass = error ? "select--error" : "";
  const finalClass = [baseClass, errorClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="select-wrapper">
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      <select
        id={id}
        className={finalClass}
        onChange={onChange}
        aria-describedby={errorId}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </div>
  );
}
