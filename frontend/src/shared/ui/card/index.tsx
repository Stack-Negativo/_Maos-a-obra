import "./styles.css";

type CardProps = {
  children: React.ReactNode;
};

export function Card({ children }: CardProps) {
  return (
    <div className="card">
      {children}
    </div>
  );
}