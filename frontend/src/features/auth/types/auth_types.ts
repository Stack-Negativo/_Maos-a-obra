export enum UserRole {
  ADMIN = "ADMIN",
  PROVIDER = "PROVIDER",
  CLIENT = "CLIENT",
}

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  providerId?: string;
  bio?: string;
  isProvider?: boolean;
  isAdmin?: boolean;
  specialties?: Array<{
    id: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }>;
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
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
  role?: UserRole.CLIENT | UserRole.PROVIDER;
  bio?: string;
  specialtyIds?: string[];
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role?: UserRole;
    providerId?: string;
    bio?: string;
    isProvider?: boolean;
    isAdmin?: boolean;
    specialties?: Array<{
      id: string;
      name: string;
      description?: string;
      isActive?: boolean;
    }>;
  };
};
