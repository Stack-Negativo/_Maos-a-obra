type Props = {
  children: React.ReactNode;
};

export function AppProvider({ children }: Props) {
  return <>{children}</>;
}