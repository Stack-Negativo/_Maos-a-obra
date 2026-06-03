# Guia React + Vite — Frontend Mãos à Obra

## Objetivo

Este documento ensina React + Vite aplicando as convenções, arquitetura e regras de negócio do projeto backend.

O objetivo é criar um frontend que:

- espelhe a arquitetura limpa do backend
- respeite as mesmas convenções e princípios
- seja escalável, testável e manutenível

---

# Parte 1: Fundamentos React + Vite

## O que é Vite?

Vite é um build tool moderno que oferece:

- **HMR (Hot Module Replacement)** instantâneo durante desenvolvimento
- **Build otimizado** para produção
- **Desenvolvimento ultra-rápido** com ES modules nativos

Comparado com Create React App:
- 10x mais rápido
- Configuração minimal
- Melhor experiência de desenvolvimento

## O que é React?

React é uma biblioteca JavaScript para construir UIs declarativas usando:

- **Componentes**: blocos reutilizáveis
- **JSX**: sintaxe que mistura HTML com JavaScript
- **State e Props**: gerenciam dados e comunicação
- **Hooks**: lógica em funções (não classes)

---

# Parte 2: Arquitetura Frontend Espelhando Backend

## Princípio: Clean Architecture no Frontend

Assim como o backend está dividido em camadas (api, services, repositories, domain), o frontend será:

```text
frontend/
├── src/
│   ├── api/              # Chamadas HTTP (como repositories do backend)
│   │   ├── auth.ts
│   │   ├── specialties.ts
│   │   ├── service-orders.ts
│   │   ├── users.ts
│   │   └── http-client.ts # Wrapper centralizado
│   │
│   ├── services/         # Lógica de negócio (regras, validações)
│   │   ├── auth.service.ts
│   │   ├── order.service.ts
│   │   └── provider.service.ts
│   │
│   ├── domain/           # Tipos, enums, constantes
│   │   ├── types.ts      # Interfaces compartilhadas
│   │   ├── enums.ts      # Estados, papéis, etc
│   │   └── constants.ts
│   │
│   ├── components/       # Componentes React (UI)
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── Orders/
│   │   │   ├── OrderCard.tsx
│   │   │   └── OrderList.tsx
│   │   └── Common/
│   │       └── Header.tsx
│   │
│   ├── hooks/            # Custom hooks (reutilizar lógica)
│   │   ├── useAuth.ts
│   │   └── useOrders.ts
│   │
│   ├── pages/            # Pages completas (rotas)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── Orders.tsx
│   │
│   ├── store/            # Estado global (Redux, Zustand, etc)
│   │   ├── auth.ts
│   │   └── orders.ts
│   │
│   └── App.tsx
```

---

# Parte 3: Tipos e Validação com TypeScript

## Por que TypeScript?

Como no backend você usa Pydantic v2 para validação, no frontend TypeScript fornece:

- **Type safety** em tempo de desenvolvimento
- **Autocompletar** robusto
- **Detecção de bugs** antecipada

## Exemplo: Espelhando Schemas do Backend

### Backend (Pydantic)

```python
# backend/schemas/user.py
from pydantic import BaseModel, EmailStr

class UserRegisterRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    telefone: str

class UserResponse(BaseModel):
    id: str
    nome: str
    email: str
```

### Frontend (TypeScript)

```typescript
// src/domain/types.ts

export interface UserRegisterRequest {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
}

export interface UserResponse {
  id: string;
  nome: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

## Validação de Dados

Assim como o backend usa Pydantic, use bibliotecas como:

- **Zod** (recomendado): tipagem + validação
- **Yup**: validação de formulários

### Exemplo com Zod

```typescript
// src/domain/schemas.ts
import { z } from "zod";

export const userRegisterSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
});

export type UserRegister = z.infer<typeof userRegisterSchema>;
```

---

# Parte 4: Chamadas HTTP Centralizadas

## Princípio: Repositories do Backend → API Client do Frontend

No backend, repositories centralizam acesso ao banco. No frontend, centralize chamadas HTTP.

### HTTP Client Wrapper

```typescript
// src/api/http-client.ts
import axios, { AxiosInstance } from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Interceptor: adiciona JWT ao header
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor: trata erros globalmente
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado: redirecionar para login
          localStorage.removeItem("auth_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string) {
    return this.client.get<T>(url);
  }

  post<T>(url: string, data: unknown) {
    return this.client.post<T>(url, data);
  }

  put<T>(url: string, data: unknown) {
    return this.client.put<T>(url, data);
  }

  delete<T>(url: string) {
    return this.client.delete<T>(url);
  }
}

export default new HttpClient();
```

### API Service: Auth

```typescript
// src/api/auth.ts
import httpClient from "./http-client";
import {
  UserRegisterRequest,
  UserResponse,
  ApiResponse,
} from "../domain/types";

export const authApi = {
  register: async (
    data: UserRegisterRequest
  ): Promise<ApiResponse<UserResponse>> => {
    const response = await httpClient.post<ApiResponse<UserResponse>>(
      "/auth/register",
      data
    );
    return response.data;
  },

  login: async (email: string, senha: string) => {
    const response = await httpClient.post<
      ApiResponse<{ access_token: string }>
    >("/auth/login", { email, senha });
    return response.data;
  },
};
```

---

# Parte 5: State Management com Zustand

## Por que Zustand?

- Simples e intuitivo
- Sem boilerplate (ao contrário do Redux)
- TypeScript excelente
- Integração fácil com React

## Exemplo: Store de Autenticação

```typescript
// src/store/auth.ts
import { create } from "zustand";

interface AuthStore {
  token: string | null;
  user: UserResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, senha: string) => Promise<void>;
  register: (data: UserRegisterRequest) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
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
        const token = response.data.access_token;
        localStorage.setItem("auth_token", token);
        set({ token, isLoading: false });
      } else {
        set({
          error: response.error?.message || "Falha no login",
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: "Erro ao conectar com servidor",
        isLoading: false,
      });
    }
  },

  register: async (data: UserRegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      if (response.success && response.data) {
        set({ user: response.data, isLoading: false });
      } else {
        set({
          error: response.error?.message || "Falha no registro",
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: "Erro ao conectar com servidor",
        isLoading: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    set({ token: null, user: null });
  },

  setToken: (token: string) => {
    localStorage.setItem("auth_token", token);
    set({ token });
  },
}));
```

---

# Parte 6: Componentes React

## Princípio: Separação de Responsabilidades

- **Presentational Components**: apenas UI (recebem props)
- **Container Components**: lógica, estado, chamadas API

### Exemplo: Componente de Login

```typescript
// src/components/Auth/LoginForm.tsx
import { useState } from "react";
import { useAuthStore } from "../../store/auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, senha);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Login</h2>

      {error && <div className="error-message">{error}</div>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        disabled={isLoading}
      />

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
```

## Custom Hooks: Reutilizar Lógica

Assim como services no backend, custom hooks encapsulam lógica:

```typescript
// src/hooks/useAuth.ts
import { useAuthStore } from "../store/auth";

export function useAuth() {
  const { token, user, isLoading, error, login, register, logout } =
    useAuthStore();

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

### Uso em Componente

```typescript
function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Acesso negado</div>;
  }

  return <div>Bem-vindo, {user?.nome}</div>;
}
```

---

# Parte 7: Roteamento com React Router

## Estrutura de Rotas

```typescript
// src/routes.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import ProtectedRoute from "./components/ProtectedRoute";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

# Parte 8: Convenções Frontend

## Nomenclatura de Arquivos

- **Componentes**: PascalCase (UserCard.tsx)
- **Hooks**: camelCase com "use" prefix (useOrders.ts)
- **Serviços/API**: camelCase (authApi.ts)
- **Tipos**: PascalCase (UserResponse.ts)
- **Enums**: PascalCase (OrderStatus.ts)

## Estrutura de Pastas

```
src/
  api/           # Chamadas HTTP
  components/    # Componentes reutilizáveis
  domain/        # Tipos, interfaces, enums
  hooks/         # Custom hooks
  pages/         # Pages completas (rotas)
  store/         # Estado global
  App.tsx
  main.tsx
```

## Padrões de Código

### Always Type Everything

```typescript
// ✅ BOM
interface Props {
  onClick: (id: string) => void;
  isLoading: boolean;
}

function Button({ onClick, isLoading }: Props) {
  return <button onClick={() => onClick("123")}>{isLoading ? "..." : "OK"}</button>;
}

// ❌ RUIM
function Button({ onClick, isLoading }: any) {
  return <button onClick={onClick}>{isLoading ? "..." : "OK"}</button>;
}
```

### Error Handling Consistente

Assim como o backend retorna `{success, data, error}`:

```typescript
// Chamada HTTP sempre retorna ApiResponse<T>
const response = await orderApi.create(data);

if (response.success) {
  // Usar response.data
  console.log(response.data);
} else {
  // Tratar erro
  console.error(response.error?.message);
}
```

### Loading States Explícitos

```typescript
{isLoading && <LoadingSpinner />}
{!isLoading && data && <Content data={data} />}
{!isLoading && error && <ErrorMessage error={error} />}
```

---

# Parte 9: Exemplo Completo - Fluxo de Login

## Backend Context

Usuário faz POST /api/v1/auth/login → recebe JWT → pode acessar rotas protegidas.

## Frontend Implementation

### 1. Store (State)

```typescript
// src/store/auth.ts
// [Veja Parte 5]
```

### 2. Hook (Abstração)

```typescript
// src/hooks/useAuth.ts
// [Veja Parte 6]
```

### 3. Componente (UI)

```typescript
// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoginForm } from "../components/Auth/LoginForm";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Se já está logado, redirecionar
  if (isAuthenticated) {
    navigate("/dashboard");
  }

  return (
    <div className="login-page">
      <LoginForm />
    </div>
  );
}
```

### 4. Rota

```typescript
// src/routes.tsx
// [Veja Parte 7]
```

---

# Parte 10: Integração com Regras de Negócio

## Exemplo: Criar Ordem de Serviço

### Backend Context

- Cliente deve estar autenticado
- Deve selecionar especialidade válida
- Deve fornecer endereço

### Frontend Implementation

```typescript
// src/domain/types.ts
export interface CreateServiceOrderRequest {
  title: string;
  description: string;
  specialtyId: string;
  addressId: string;
  preferredDate: string;
}

export interface ServiceOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  status: OrderStatus;
  estimatedValue: number;
  preferredDate: string;
  createdAt: string;
}

export enum OrderStatus {
  CREATED = "CREATED",
  PROVIDER_SELECTED = "PROVIDER_SELECTED",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}
```

```typescript
// src/api/orders.ts
import httpClient from "./http-client";
import {
  CreateServiceOrderRequest,
  ServiceOrder,
  ApiResponse,
} from "../domain/types";

export const ordersApi = {
  create: async (
    data: CreateServiceOrderRequest
  ): Promise<ApiResponse<ServiceOrder>> => {
    const response = await httpClient.post<ApiResponse<ServiceOrder>>(
      "/service_orders",
      data
    );
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<ServiceOrder[]>> => {
    const response = await httpClient.get<ApiResponse<ServiceOrder[]>>(
      "/service_orders"
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<ServiceOrder>> => {
    const response = await httpClient.get<ApiResponse<ServiceOrder>>(
      `/service_orders/${id}`
    );
    return response.data;
  },
};
```

```typescript
// src/store/orders.ts
import { create } from "zustand";
import { ordersApi } from "../api/orders";
import {
  CreateServiceOrderRequest,
  ServiceOrder,
} from "../domain/types";

interface OrdersStore {
  orders: ServiceOrder[];
  isLoading: boolean;
  error: string | null;

  fetchOrders: () => Promise<void>;
  createOrder: (data: CreateServiceOrderRequest) => Promise<ServiceOrder | null>;
}

export const useOrdersStore = create<OrdersStore>((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await ordersApi.getAll();
      if (response.success && response.data) {
        set({ orders: response.data, isLoading: false });
      } else {
        set({
          error: response.error?.message || "Erro ao buscar ordens",
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: "Erro ao conectar",
        isLoading: false,
      });
    }
  },

  createOrder: async (data: CreateServiceOrderRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ordersApi.create(data);
      if (response.success && response.data) {
        set((state) => ({
          orders: [...state.orders, response.data as ServiceOrder],
          isLoading: false,
        }));
        return response.data;
      } else {
        set({
          error: response.error?.message || "Erro ao criar ordem",
          isLoading: false,
        });
        return null;
      }
    } catch (err) {
      set({
        error: "Erro ao conectar",
        isLoading: false,
      });
      return null;
    }
  },
}));
```

---

# Conclusão

Ao seguir esta arquitetura:

1. ✅ Frontend espelha estrutura do backend (clean architecture)
2. ✅ Chamadas HTTP centralizadas (como repositories)
3. ✅ Tipagem forte em tudo (como Pydantic)
4. ✅ Estado global previsível (como services)
5. ✅ Componentes isolados e testáveis
6. ✅ Fácil manutenção e escalabilidade

**Próximo passo:** Inicializar projeto React + Vite e começar implementação!
