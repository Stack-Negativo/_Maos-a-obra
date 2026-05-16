type Props = {
  children: React.ReactNode;
};

export function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {children}
    </div>
  );
}