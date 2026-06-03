import type {
  ChangeEvent,
  InputHTMLAttributes,
} from "react";

import "./styles.css";

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> & {
  onChange?: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
};

export function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  className,
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className ? `input ${className}` : "input"}
      {...props}
    />
  );
}
