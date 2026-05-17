import { createContext, useContext, useState } from "react";
import type { AuthContextType, User } from "../types/auth_types";
import { UserRole } from "../types/auth_types";

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Mock user for development
const MOCK_USER: User = {
  id: 1,
  name: "João Cliente",
  email: "joao@example.com",
  role: UserRole.CLIENT,
  isProvider: false,
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user from localStorage or use mock
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return MOCK_USER;
      }
    }
    return MOCK_USER;
  });

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const switchToProvider = () => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      role: UserRole.PROVIDER,
      isProvider: true,
    };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const switchToClient = () => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      role: UserRole.CLIENT,
      isProvider: false,
    };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    switchToProvider,
    switchToClient,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }
  return context;
}
