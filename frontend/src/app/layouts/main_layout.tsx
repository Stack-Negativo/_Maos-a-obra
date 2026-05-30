type Props = {
  children: React.ReactNode;
};

export function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      {children}
    </div>
  );
}
