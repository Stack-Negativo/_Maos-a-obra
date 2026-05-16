import { createContext } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type SignInPayload = {
  email: string;
  password: string;
};

type AuthContextData = {
  user: User | null;

  token: string | null;

  signIn: (
    data: SignInPayload,
  ) => Promise<void>;

  signOut: () => void;
};

export const AuthContext =
  createContext<AuthContextData>(
    {} as AuthContextData,
  );