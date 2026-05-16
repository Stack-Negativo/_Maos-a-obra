import "./styles.css";

type LabelProps = {
  children: React.ReactNode;
};

export function Label({ children }: LabelProps) {
  return (
    <label className="label">
      {children}
    </label>
  );
}