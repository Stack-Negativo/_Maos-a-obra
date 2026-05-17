export enum UserRole {
  ADMIN = "ADMIN",
  PROVIDER = "PROVIDER",
  CLIENT = "CLIENT",
}

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isProvider?: boolean;
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchToProvider: () => void;
  switchToClient: () => void;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};