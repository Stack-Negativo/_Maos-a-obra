# Convenções Frontend — React + Vite

## Objetivo

Este documento define padrões técnicos e arquiteturais obrigatórios para o frontend.

O objetivo é garantir:

- consistência com o backend
- legibilidade
- escalabilidade
- manutenibilidade
- previsibilidade

---

# Stack Oficial

## Linguagem

- TypeScript 5.x

---

## Framework

- React 18.x

---

## Build Tool

- Vite 5.x

---

## State Management

- Zustand

---

## HTTP Client

- Axios

---

## Roteamento

- React Router v6

---

## Validação

- Zod

---

## Styling

- CSS Modules ou TailwindCSS (a escolher)

---

## Testing

- Vitest (para unit tests)
- React Testing Library (para component tests)

---

# Estrutura Oficial do Projeto

```text
frontend/
├── src/
│   ├── api/              # Chamadas HTTP
│   │   ├── auth.ts
│   │   ├── orders.ts
│   │   ├── specialties.ts
│   │   ├── users.ts
│   │   └── http-client.ts
│   │
│   ├── components/       # Componentes React
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── Orders/
│   │   │   ├── OrderCard.tsx
│   │   │   └── OrderList.tsx
│   │   ├── Common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── index.ts
│   │
│   ├── domain/           # Tipos e constantes
│   │   ├── types.ts
│   │   ├── enums.ts
│   │   ├── constants.ts
│   │   └── schemas.ts
│   │
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useOrders.ts
│   │   └── index.ts
│   │
│   ├── pages/            # Pages completas
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Orders.tsx
│   │   └── NotFound.tsx
│   │
│   ├── store/            # Zustand stores
│   │   ├── auth.ts
│   │   ├── orders.ts
│   │   └── index.ts
│   │
│   ├── utils/            # Utilitários
│   │   └── helpers.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
│
├── public/
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

# Convenções de Nomenclatura

## Componentes

- PascalCase
- Nomes descritivos
- Sufixo ou prefix quando necessário

```typescript
// ✅ BOM
LoginForm.tsx
OrderCard.tsx
UserProfile.tsx

// ❌ RUIM
loginform.tsx
card.tsx
profile.tsx
```

## Arquivos TypeScript

- camelCase para arquivos (exceto componentes)

```typescript
// ✅ BOM
src/api/auth.ts
src/hooks/useAuth.ts
src/utils/formatters.ts

// ❌ RUIM
src/api/Auth.ts
src/hooks/UseAuth.ts
```

## Tipos e Interfaces

- PascalCase
- Prefix "I" é opcional (recomenda-se não usar)
- Nome descritivo

```typescript
// ✅ BOM
interface UserResponse {}
type OrderStatus = "CREATED" | "FINISHED";
enum Role { CLIENT, PROVIDER }

// ❌ RUIM
interface IUserResponse {}
interface user_response {}
type order_status = "CREATED" | "FINISHED";
```

## Variáveis e Funções

- camelCase
- Nomes descritivos

```typescript
// ✅ BOM
const isLoading = true;
const handleSubmit = () => {};
const fetchOrders = async () => {};

// ❌ RUIM
const isload = true;
const handle = () => {};
const fetch = async () => {};
```

---

# Responsabilidade das Pastas

## api/

Responsável exclusivamente por:

- Chamadas HTTP
- Mapeamento de endpoints
- Formatação de requisição/resposta

Não deve conter:

- Lógica de negócio
- Validações de domínio
- Estado (usar stores)

### Exemplo: api/auth.ts

```typescript
import httpClient from "./http-client";
import { UserRegisterRequest, UserResponse, ApiResponse } from "../domain/types";

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

---

## store/

Responsável por:

- Estado global
- Ações (mutations)
- Sincronização com API

Não deve conter:

- Chamadas HTTP diretas (usar api/)
- Lógica de componente
- UI

### Exemplo: store/auth.ts

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

---

## hooks/

Responsável por:

- Encapsular lógica de componentes
- Reutilização entre componentes
- Abstração de stores

Não deve conter:

- UI
- Chamadas HTTP diretas

### Exemplo: hooks/useAuth.ts

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

---

## components/

Responsável por:

- Renderização de UI
- Receber props
- Usar hooks e stores

Não deve conter:

- Chamadas HTTP diretas
- Lógica complexa de negócio
- Estado local desnecessário

### Exemplo: components/Auth/LoginForm.tsx

```typescript
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, senha);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
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

---

## domain/

Responsável por:

- Interfaces (contracts)
- Enums
- Constantes
- Schemas de validação

Deve refletir o backend (schemas, enums, tipos).

### Exemplo: domain/types.ts

```typescript
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### Exemplo: domain/enums.ts

```typescript
export enum OrderStatus {
  CREATED = "CREATED",
  PROVIDER_SELECTED = "PROVIDER_SELECTED",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export enum UserRole {
  CLIENT = "CLIENT",
  PROVIDER = "PROVIDER",
  ADMIN = "ADMIN",
}
```

---

## pages/

Responsável por:

- Páginas completas
- Layout de rota
- Orquestração de componentes

---

# Regras de Qualidade

## TypeScript

- Nunca usar `any` (usar `unknown` se necessário, depois narrowing)
- Sempre tipar props e retorno de funções
- Enabled strict mode no tsconfig

```typescript
// ✅ BOM
interface Props {
  onClick: (id: string) => void;
  items: OrderStatus[];
}

function Component({ onClick, items }: Props): React.ReactNode {
  return <div>{items.length}</div>;
}

// ❌ RUIM
function Component(props: any) {
  return <div>{props.items.length}</div>;
}
```

---

## HTTP Responses

Sempre seguir formato do backend: `{success, data, error}`

```typescript
// ✅ BOM
const response = await authApi.login(email, senha);
if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error?.message);
}

// ❌ RUIM
const response = await authApi.login(email, senha);
if (response) {
  console.log(response);
}
```

---

## Async/Await

- Sempre usar async/await (não Promises diretas)
- Sempre envolver em try/catch
- Sempre atualizar loading state

```typescript
// ✅ BOM
const fetchOrders = async () => {
  set({ isLoading: true });
  try {
    const response = await ordersApi.getAll();
    if (response.success) {
      set({ orders: response.data, isLoading: false });
    }
  } catch (err) {
    set({ error: "Erro", isLoading: false });
  }
};

// ❌ RUIM
const fetchOrders = () => {
  ordersApi.getAll().then((response) => {
    set({ orders: response });
  });
};
```

---

## Hooks

Seguir regras de hooks React:

- Nunca chame condicionalmente
- Nunca em loops
- Sempre no topo do componente

```typescript
// ✅ BOM
function Component() {
  const { user } = useAuth();
  const { orders } = useOrders();

  if (!user) return null;

  return <div>{orders.length}</div>;
}

// ❌ RUIM
function Component() {
  if (someCondition) {
    const { user } = useAuth(); // ERRO!
  }
}
```

---

# Padrões Recomendados

## Loading + Error + Data

```typescript
{isLoading && <LoadingSpinner />}
{!isLoading && error && <ErrorMessage error={error} />}
{!isLoading && !error && data && <Content data={data} />}
{!isLoading && !error && !data && <EmptyState />}
```

## Form Validation com Zod

```typescript
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Mínimo 8 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Validar em submit
const handleSubmit = (data: LoginForm) => {
  const validated = loginSchema.parse(data); // Lança erro se inválido
  login(validated.email, validated.senha);
};
```

## Protected Routes

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

# Checklist para PR (Pull Request)

Antes de submeter código:

- [ ] TypeScript sem erros
- [ ] Nenhum `any` no código
- [ ] Componentes tipados
- [ ] Sem console.log em produção
- [ ] Sem hardcoded URLs (usar constants)
- [ ] Testes existem (se aplicável)
- [ ] Nomes descritivos em variáveis e funções
- [ ] Documentação de componentes complexos

---

# Referência Rápida: Padrões Comuns

### Consumir Store

```typescript
const { user, isLoading } = useAuthStore();
```

### Fazer Chamada HTTP

```typescript
const response = await ordersApi.getById(id);
if (response.success) {
  // usar response.data
}
```

### Criar Custom Hook

```typescript
export function useMyHook() {
  const store = useMyStore();
  return { /* abstração */ };
}
```

### Tipar Componente Props

```typescript
interface Props {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: Props) {
  // ...
}
```

### Usar Zustand

```typescript
const store = useMyStore();
await store.action();
```
