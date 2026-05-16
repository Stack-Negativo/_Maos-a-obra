# Anti-Padrões Frontend

## Objetivo

Este documento define práticas proibidas durante desenvolvimento do frontend.

O objetivo é:

- evitar degradação arquitetural
- manter consistência com backend
- reduzir acoplamento
- evitar overengineering
- preservar previsibilidade

---

# Anti-Padrões Proibidos

---

# AP01 — Lógica de Negócio em Componentes

Nunca:

- validar regras de negócio em componentes
- colocar fluxos operacionais em componentes

Correto: colocar em `services/` ou `store/`

```typescript
// ❌ RUIM: Lógica em componente
function OrderForm() {
  const handleSubmit = () => {
    // Validar se prestador tem especialidade
    if (!prestador.especialidades.length) {
      throw new Error("Sem especialidade");
    }
    // Criar OS...
  };
}

// ✅ BOM: Lógica em store/service
export const useOrdersStore = create((set) => ({
  createOrder: async (data) => {
    if (!data.prestador.especialidades.length) {
      throw new Error("Sem especialidade");
    }
    // Criar OS...
  },
}));

function OrderForm() {
  const { createOrder } = useOrdersStore();
  const handleSubmit = () => {
    createOrder(data);
  };
}
```

---

# AP02 — Store Contendo Chamadas API Diretas (sem Centralized API)

Stores não devem chamar HTTP diretamente — devem usar `api/` module.

```typescript
// ❌ RUIM: Axios direto em store
export const useOrdersStore = create((set) => ({
  fetchOrders: async () => {
    const response = await axios.get("/service_orders");
  },
}));

// ✅ BOM: API client centralizado
import { ordersApi } from "../api/orders";

export const useOrdersStore = create((set) => ({
  fetchOrders: async () => {
    const response = await ordersApi.getAll();
  },
}));
```

---

# AP03 — Usar `any` em TypeScript

Nunca usar `any`. Se precisa ser flexible, usar `unknown` + type narrowing.

```typescript
// ❌ RUIM
function Component(props: any) {
  return <div>{props.value}</div>;
}

// ✅ BOM
interface Props {
  value: string;
}

function Component({ value }: Props) {
  return <div>{value}</div>;
}

// ✅ BOM (se realmente precisa ser flexível)
function Component(props: unknown) {
  if (typeof props === "object" && props !== null && "value" in props) {
    return <div>{(props as { value: string }).value}</div>;
  }
  return null;
}
```

---

# AP04 — State Local Desnecessário

Não duplicar estado entre componente local e store global.

```typescript
// ❌ RUIM: Duplicar estado
function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const storeOrders = useOrdersStore((s) => s.orders);

  return <div>{orders.length}</div>;
}

// ✅ BOM: Usar store diretamente
function OrderList() {
  const orders = useOrdersStore((s) => s.orders);
  return <div>{orders.length}</div>;
}

// ✅ BOM: Usar local se for realmente local (UI state)
function OrderCard({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>Expandir</button>
      {isExpanded && <details>{order.description}</details>}
    </div>
  );
}
```

---

# AP05 — HTTP Calls em Event Handlers sem Loading State

Nunca fazer request sem gerenciar loading/error.

```typescript
// ❌ RUIM: Sem loading/error
function LoginForm() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await authApi.login(email, senha);
    // Sem feedback de loading!
  };

  return <button type="submit">Entrar</button>;
}

// ✅ BOM: Com loading/error
function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, senha);
  };

  return (
    <>
      {error && <div>{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </>
  );
}
```

---

# AP06 — Hardcoded URLs ou API Endpoints

Nunca hardcode URLs. Use variáveis de ambiente.

```typescript
// ❌ RUIM
const response = await axios.get("http://localhost:8000/api/v1/orders");

// ✅ BOM
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const httpClient = axios.create({ baseURL: API_BASE_URL });
const response = await httpClient.get("/orders");
```

---

# AP07 — Props Drilling (passar props por muitos níveis)

Não passar props de componente pai para filho por muitos níveis. Usar context/store.

```typescript
// ❌ RUIM: Props drilling
function Page() {
  const user = useAuth((s) => s.user);
  return <Container user={user} />;
}

function Container({ user }: { user: User }) {
  return <Card user={user} />;
}

function Card({ user }: { user: User }) {
  return <div>{user.nome}</div>;
}

// ✅ BOM: Usar hook direto
function Card() {
  const user = useAuth((s) => s.user);
  return <div>{user?.nome}</div>;
}
```

---

# AP08 — Não Usar React Hook Dependencies Corretamente

Pode gerar bugs e loops infinitos. Respeitar regras de hooks.

```typescript
// ❌ RUIM: Effect sem deps ou deps errados
function Component() {
  const orders = useOrdersStore((s) => s.orders);

  useEffect(() => {
    fetchOrders(); // Roda a cada render!
  }); // Sem dependency array

  return <div>{orders.length}</div>;
}

// ✅ BOM: Dependency array correto
function Component() {
  const { fetchOrders } = useOrdersStore();
  const orders = useOrdersStore((s) => s.orders);

  useEffect(() => {
    fetchOrders();
  }, []); // Roda apenas na montagem

  return <div>{orders.length}</div>;
}
```

---

# AP09 — Esquecer de Desinscrever em Cleanup

Se tem listeners ou subscriptions, sempre limpar.

```typescript
// ❌ RUIM: Memory leak
function Component() {
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    // Nunca remove!
  });

  return <div>Content</div>;
}

// ✅ BOM: Cleanup function
function Component() {
  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <div>Content</div>;
}
```

---

# AP10 — Conditional Hook Calls

Nunca chamar hooks condicionalmente. Isso viola regras fundamentais de React.

```typescript
// ❌ RUIM
function Component({ shouldUseAuth }: { shouldUseAuth: boolean }) {
  if (shouldUseAuth) {
    const auth = useAuth(); // ERRO!
  }
}

// ✅ BOM
function Component({ shouldUseAuth }: { shouldUseAuth: boolean }) {
  const auth = useAuth();

  if (!shouldUseAuth) {
    return null;
  }

  return <div>{auth.user?.nome}</div>;
}
```

---

# AP11 — Mudar Token sem Sincronizar Estado

Se token muda (logout/login), atualizar estado e limpar cache.

```typescript
// ❌ RUIM: Descompassado
function logout() {
  localStorage.removeItem("auth_token");
  // Mas store ainda tem token antigo!
}

// ✅ BOM: Sincronizar
function logout() {
  useAuthStore.setState({
    token: null,
    user: null,
  });
  localStorage.removeItem("auth_token");
}
```

---

# AP12 — Não Validar Input do Usuário

Sempre validar dados antes de enviar para API.

```typescript
// ❌ RUIM: Sem validação
function RegisterForm() {
  const handleSubmit = async () => {
    await authApi.register({ email, senha, nome, telefone });
  };
}

// ✅ BOM: Com validação (Zod)
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Mínimo 8 caracteres"),
  nome: z.string().min(3, "Mínimo 3 caracteres"),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
});

function RegisterForm() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = registerSchema.parse({
        email,
        senha,
        nome,
        telefone,
      });
      await authApi.register(validated);
    } catch (err) {
      setError("Dados inválidos");
    }
  };
}
```

---

# AP13 — Ignorar CORS e Headers

Se backend retorna CORS error, não tentar bypass. Verificar configuração backend.

```typescript
// ❌ RUIM: Bypass CORS (não funciona)
const response = await axios.get(url, {
  headers: { "Access-Control-Allow-Origin": "*" },
});

// ✅ BOM: Backend deve configurar CORS
// backend: cors.CORSMiddleware(app, allow_origins=["http://localhost:5173"])
```

---

# AP14 — Salvar Dados Sensíveis em localStorage sem Segurança

Token deve ter expiração. Considerar HttpOnly cookies.

```typescript
// ⚠️ ACEITÁVEL: localStorage com segurança
localStorage.setItem("auth_token", token); // JWT tem validade
localStorage.setItem("user_id", user.id); // Não sensível

// ❌ RUIM
localStorage.setItem("password", "12345"); // NUNCA!
localStorage.setItem("credit_card", "4111..."); // NUNCA!
```

---

# AP15 — Componentes Muito Grandes

Separar componentes grandes em componentes menores e reutilizáveis.

```typescript
// ❌ RUIM: 500 linhas em um arquivo
function OrderDetail() {
  // renderizar form, aplicantes, timeline, etc...
}

// ✅ BOM: Separar responsabilidades
function OrderDetail({ orderId }: { orderId: string }) {
  return (
    <>
      <OrderInfo orderId={orderId} />
      <ApplicationsList orderId={orderId} />
      <OrderTimeline orderId={orderId} />
    </>
  );
}
```

---

# Checklist Anti-Padrões

Antes de fazer PR:

- [ ] Sem `any` em TypeScript
- [ ] Sem hardcoded URLs
- [ ] Sem props drilling excessivo
- [ ] Sem hooks chamados condicionalmente
- [ ] Todo HTTP call tem loading/error
- [ ] Store não chama axios direto
- [ ] Componentes tipados
- [ ] Sem console.log em produção
- [ ] Nomes descritivos (não x, y, data)
- [ ] Separação de responsabilidades respeitada
