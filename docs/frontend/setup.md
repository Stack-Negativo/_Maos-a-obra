# Setup Rápido — Frontend Mãos à Obra

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## Passo 1: Criar Projeto

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
```

## Passo 2: Instalar Dependências

```bash
npm install
```

### Dependências Principais

```bash
# State management
npm install zustand

# HTTP client
npm install axios

# Roteamento
npm install react-router-dom

# Validação
npm install zod

# CSS (opcional, escolher um)
npm install -D tailwindcss postcss autoprefixer
# ou
npm install classnames
```

## Passo 3: Estrutura de Pastas

Criar estrutura conforme `docs/frontend/convencoes.md`:

```bash
mkdir -p src/{api,components,domain,hooks,pages,store,utils}
mkdir -p src/components/{Auth,Orders,Common}
```

## Passo 4: Configuração TypeScript

O Vite já cria `tsconfig.json`. Garantir modo strict:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

## Passo 5: Variáveis de Ambiente

Criar `.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Acessar em componentes:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Passo 6: Rodar em Desenvolvimento

```bash
npm run dev
```

Acessar http://localhost:5173

---

## Estrutura Inicial de Código

### src/domain/types.ts

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UserResponse {
  id: string;
  nome: string;
  email: string;
}

export interface UserRegisterRequest {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
}
```

### src/api/http-client.ts

```typescript
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Adicionar token ao header
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tratar erro de autenticação
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default httpClient;
```

### src/api/auth.ts

```typescript
import httpClient from "./http-client";
import { UserResponse, UserRegisterRequest, ApiResponse } from "../domain/types";

export const authApi = {
  register: async (data: UserRegisterRequest): Promise<ApiResponse<UserResponse>> => {
    const response = await httpClient.post<ApiResponse<UserResponse>>(
      "/auth/register",
      data
    );
    return response.data;
  },

  login: async (email: string, senha: string) => {
    const response = await httpClient.post<ApiResponse<{ access_token: string }>>(
      "/auth/login",
      { email, senha }
    );
    return response.data;
  },
};
```

### src/store/auth.ts

```typescript
import { create } from "zustand";
import { authApi } from "../api/auth";
import { UserResponse, UserRegisterRequest } from "../domain/types";

interface AuthStore {
  token: string | null;
  user: UserResponse | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, senha: string) => Promise<void>;
  register: (data: UserRegisterRequest) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem("auth_token"),
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, senha: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, senha);
      if (response.success && response.data) {
        localStorage.setItem("auth_token", response.data.access_token);
        set({ token: response.data.access_token, isLoading: false });
      } else {
        set({ error: response.error?.message || "Falha", isLoading: false });
      }
    } catch (err) {
      set({ error: "Erro ao conectar", isLoading: false });
    }
  },

  register: async (data: UserRegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      if (response.success) {
        set({ isLoading: false });
      } else {
        set({ error: response.error?.message || "Falha", isLoading: false });
      }
    } catch (err) {
      set({ error: "Erro ao conectar", isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    set({ token: null, user: null });
  },
}));
```

### src/hooks/useAuth.ts

```typescript
import { useAuthStore } from "../store/auth";

export function useAuth() {
  const { token, user, isLoading, error, login, register, logout } = useAuthStore();

  const isAuthenticated = !!token;

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
```

### src/App.tsx

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login Page (TODO)</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Dashboard (TODO)</div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### src/main.tsx

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Próximos Passos

1. Implementar páginas de Login/Register
2. Implementar Dashboard
3. Implementar fluxo de Ordens de Serviço
4. Adicionar testes

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview de produção
npm run preview

# Linter (se configurado)
npm run lint
```

---

## Desvio de Padrão com Backend

Se encontrar diferenças nas respostas da API:

1. Atualizar `docs/frontend/convencoes.md`
2. Atualizar tipos em `src/domain/types.ts`
3. Adaptar chamadas em `src/api/*.ts`

**Fonte única de verdade:** `/docs` (compartilhado entre frontend e backend)
