import "./styles.css";

type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
};

export function Button({
  children,
  type = "button",
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      className="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}