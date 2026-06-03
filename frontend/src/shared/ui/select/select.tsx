import { Label } from "@/shared/ui/label";
import "./select.css";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[];
  label?: string;
  required?: boolean;
  id?: string;
};

export function Select({
  options,
  label,
  required,
  id,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="select-wrapper">
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      <select
        id={id}
        className={`select ${className || ""}`}
        {...props}
      >
        {options.map((option, index) => (
          <option
            key={`${option.value}-${index}`}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
