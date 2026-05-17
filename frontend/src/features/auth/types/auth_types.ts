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