import type {
  ChangeEvent,
} from "react";

import "./styles.css";

type InputProps = {
  type?: string;
  placeholder?: string;
  value?: string;

  onChange?: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
};

export function Input({
  type = "text",
  placeholder,
  value,
  onChange,
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input"
    />
  );
}