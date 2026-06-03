import { createContext } from "react";
import type { User } from "@/features/auth/types/auth_types";

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

  updateUser: (user: User) => void;

  signOut: () => void;
};

export const AuthContext =
  createContext<AuthContextData>(
    {} as AuthContextData,
  );
