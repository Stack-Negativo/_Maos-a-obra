# Frontend — Roadmap de Implementação

## Baseado na Arquitetura Backend

Este documento mapeia os fluxos do backend para features do frontend.

---

# Fase 1: Autenticação e Setup (100% backend done)

**Status Backend:** ✅ DONE

### Features

- [x] Registro de usuário (email, nome, senha, telefone)
- [x] Login com JWT
- [x] Token armazenado e restaurado

### Frontend TODO

- [ ] Página de Login
- [ ] Página de Registro
- [ ] Validação de formulários com Zod
- [ ] Armazenamento de JWT
- [ ] Proteção de rotas
- [ ] Logout

### Componentes Necessários

```
components/Auth/
  ├── LoginForm.tsx
  ├── RegisterForm.tsx
  └── ProtectedRoute.tsx

pages/
  ├── Login.tsx
  ├── Register.tsx
```

### Endpoints Consumidos

- POST `/auth/register`
- POST `/auth/login`

---

# Fase 2: Especialidades (100% backend done)

**Status Backend:** ✅ DONE

### Features

- [x] Listar especialidades
- [x] Especialidades ativas
- [x] Metadados (nome, descrição)

### Frontend TODO

- [ ] Página de Especialidades
- [ ] Componente de seleção de especialidades
- [ ] Cache/state management
- [ ] Busca/filtro por especialidade

### Componentes Necessários

```
components/Specialties/
  ├── SpecialtyList.tsx
  ├── SpecialtyCard.tsx
  └── SpecialtySelector.tsx

pages/
  └── Specialties.tsx
```

### Endpoints Consumidos

- GET `/specialties`

---

# Fase 3: Usuários — Papéis e Perfil

**Status Backend:** ✅ DONE (estrutura)

### Features

- [x] Usuário tem papel único: Client, Provider ou Admin
- [x] Dados básicos armazenados em `users`
- [x] Papéis em tabelas separadas: `clients`, `providers`, `admins`

### Lógica de Negócio

**RI01 — Email Único**
- Email deve ser único no sistema
- Emails são case-insensitive

**RN01 — Validação de Prestador**
- Prestador sem especialidade não pode participar do fluxo
- Prestador precisa de pelo menos uma especialidade

### Frontend TODO

- [ ] Página de Perfil de Usuário
- [ ] Edição de perfil
- [ ] Seleção de papel: Cliente vs Prestador (após cadastro)
- [ ] Fluxo para virar Prestador (bio + especialidades)

### Componentes Necessários

```
components/Profile/
  ├── UserProfile.tsx
  ├── UserEdit.tsx
  └── BecomeProviderForm.tsx

pages/
  ├── Profile.tsx
  └── BecomeProvider.tsx
```

### Endpoints Consumidos (quando implementados)

- GET `/users/me`
- PUT `/users/me`
- POST `/users/providers` (virar prestador)
- GET `/users/providers/{id}`

---

# Fase 4: Endereços (0% backend done — UNBLOCKED)

**Status Backend:** NOT STARTED

### Features Esperadas

- Usuário pode registrar múltiplos endereços
- Cada endereço tem: label, zip, street, number, complement, neighborhood, city, state, lat, long
- Necessário para criar Ordem de Serviço

### Frontend TODO (quando backend pronto)

- [ ] Página de Gerenciamento de Endereços
- [ ] Adicionar endereço com CEP
- [ ] Editar/deletar endereço
- [ ] Integração com Google Maps (opcional)

### Componentes Necessários

```
components/Address/
  ├── AddressList.tsx
  ├── AddressForm.tsx
  └── AddressCard.tsx

pages/
  └── Addresses.tsx
```

---

# Fase 5: Prestadores (0% backend done — UNBLOCKED)

**Status Backend:** NOT STARTED

### Features Esperadas

- Prestador tem perfil com bio
- Vinculado a especialidades
- Agendas (schedules) para marcar indisponibilidade
- Rating average (avaliações)
- Pode ser suspenso

### Lógica de Negócio

**RN04 — Suspensão por Desempenho**
- Prestador com média < 3 estrelas em 10 últimas avaliações é suspenso
- Suspensos não aparecem em buscas e não podem se candidatar

### Frontend TODO (quando backend pronto)

- [ ] Página de Prestadores (busca)
- [ ] Perfil público do Prestador
- [ ] Visualizar especialidades
- [ ] Visualizar avaliações
- [ ] Gerenciador de agenda (para prestador)

### Componentes Necessários

```
components/Provider/
  ├── ProviderCard.tsx
  ├── ProviderProfile.tsx
  ├── ProviderSchedule.tsx
  └── RatingDisplay.tsx

pages/
  ├── Providers.tsx
  └── ProviderDetail.tsx
```

---

# Fase 6: Ordens de Serviço — Core (0% backend done — BLOCKED)

**Status Backend:** BLOCKED (aguardando Prestadores e Endereços)

### Features Esperadas

#### Criação de OS

- Cliente (autenticado) cria OS
- Fornece: título, descrição, especialidade, endereço, data preferida
- Recebe: código único legível, status = CREATED

#### Estados da OS

```
CREATED
  ↓
PROVIDER_SELECTED (Provider selecionado)
  ↓
SCHEDULED (Data/hora confirmada)
  ↓
IN_PROGRESS (Serviço em execução)
  ↓
FINISHED (Serviço finalizado, aguarda confirmação)
  ↓
CONFIRMED (Cliente confirmou)
```

### Lógica de Negócio

**RN02 — Política de Cancelamento**
- Cancelamento sem taxa: mínimo 2h antes de `scheduled_at`
- Cancelamentos tardios geram taxa

**RN03 — Liberação de Pagamento**
- Pagamento liberado apenas após confirmação do cliente
- Não deve ocorrer automaticamente

### Fluxo Esperado

1. **Cliente cria OS**: título, descrição, especialidade, endereço, data preferida
2. **Prestadores veem no feed** e se candidatam
3. **Cliente seleciona Prestador**: aplicação marcada como ACCEPTED, outras como REJECTED
4. **Agendamento**: após contato, data/hora final é registrada → status = SCHEDULED
5. **Execução**: Prestador marca início → IN_PROGRESS, depois finaliza → aguarda confirmação
6. **Confirmação**: Cliente confirma → FINISHED
7. **Avaliação e Pagamento**: Sistema libera avaliações e processa pagamento

### Frontend TODO (quando backend pronto)

#### Para Cliente

- [ ] Página de Criar OS
- [ ] Listar minhas OS
- [ ] Visualizar candidatos
- [ ] Selecionar prestador
- [ ] Confirmar agendamento
- [ ] Confirmar conclusão
- [ ] Avaliar prestador
- [ ] Cancelar OS (com política de 2h)

#### Para Prestador

- [ ] Feed de OS disponíveis
- [ ] Se candidatar a OS
- [ ] Visualizar minhas candidaturas
- [ ] Ver OS aceitas
- [ ] Marcar como IN_PROGRESS
- [ ] Marcar como FINISHED (e aguardar confirmação)
- [ ] Receber avaliação
- [ ] Histório de OS executadas

### Componentes Necessários

```
components/Orders/
  ├── OrderCreate.tsx
  ├── OrderCard.tsx
  ├── OrderList.tsx
  ├── OrderDetail.tsx
  ├── OrderApplications.tsx
  ├── OrderTimeline.tsx
  ├── CancelOrderModal.tsx
  └── RatingForm.tsx

pages/
  ├── MyOrders.tsx
  ├── OrderDetail.tsx
  ├── CreateOrder.tsx
  └── OrderFeed.tsx (para prestador)
```

### Endpoints Consumidos (quando implementados)

- POST `/service_orders` (criar)
- GET `/service_orders` (listar)
- GET `/service_orders/{id}` (detalhe)
- PUT `/service_orders/{id}/cancel` (cancelar)
- PUT `/service_orders/{id}/status` (mudar status)
- POST `/applications` (se candidatar)
- GET `/applications` (listar candidatos)
- PUT `/applications/{id}/accept` (aceitar prestador)
- GET `/service_orders/feed` (feed para prestador)

---

# Fase 7: Avaliações (0% backend done — BLOCKED)

**Status Backend:** Depende de Ordens de Serviço

### Lógica de Negócio

**RN05 — Critério de Avaliação**
- Usuários só podem avaliar se tiverem executado uma OS juntos
- Avaliação vinculada à OS
- Não pode haver autoavaliação

### Frontend TODO (quando backend pronto)

- [ ] Formulário de avaliação (stars + comentário)
- [ ] Histórico de avaliações
- [ ] Média de rating do prestador

### Endpoints Consumidos (quando implementados)

- POST `/ratings`
- GET `/ratings/{user_id}`
- GET `/ratings/order/{order_id}`

---

# Fase 8: Pagamentos (0% backend done — BLOCKED)

**Status Backend:** Depende de Ordens de Serviço

### Features Esperadas

- Integração com gateway de pagamento (mock inicialmente)
- Rastreabilidade de transações
- Liberação apenas após confirmação do cliente

### Frontend TODO (quando backend pronto)

- [ ] Página de pagamentos (lista)
- [ ] Confirmar pagamento
- [ ] Histórico de transações
- [ ] Integração com gateway (Stripe, PayPal, etc)

### Endpoints Consumidos (quando implementados)

- GET `/payments`
- GET `/payments/{order_id}`
- POST `/payments/{order_id}/process`

---

# Matriz de Dependências

```
Auth (DONE)
  ↓
Specialties (DONE)
  ├─→ Providers (UNBLOCKED)
  │     └─→ Orders (BLOCKED)
  │         ├─→ Ratings (BLOCKED)
  │         └─→ Payments (BLOCKED)
  │
  └─→ Users/Roles (DONE structure)
      └─→ Addresses (UNBLOCKED)
          └─→ Orders (BLOCKED)
```

---

# Recomendação de Ordem

1. ✅ **Fase 1: Auth** (iniciar imediatamente)
2. ✅ **Fase 2: Specialties** (paralelo com Auth)
3. ⏳ **Fase 3: Usuários/Papéis** (após Auth)
4. ⏳ **Fase 4: Endereços** (quando backend estiver pronto)
5. ⏳ **Fase 5: Prestadores** (quando backend estiver pronto)
6. ⏳ **Fase 6: Ordens de Serviço** (core — quando tudo estiver pronto)
7. ⏳ **Fase 7: Avaliações** (após OS)
8. ⏳ **Fase 8: Pagamentos** (mock inicialmente)

---

# Padrão de Implementação

Para cada feature:

1. Implementar tipos em `domain/types.ts` (baseado em backend schemas)
2. Criar API client em `api/feature.ts`
3. Criar Zustand store em `store/feature.ts`
4. Criar custom hook em `hooks/useFeature.ts`
5. Criar componentes em `components/Feature/`
6. Criar página em `pages/Feature.tsx`
7. Adicionar rota em `App.tsx`

---

# Integração com Backend

- API Base URL: http://localhost:8000/api/v1
- JWT Token: localStorage → header Authorization: Bearer <token>
- Resposta Padrão: {success, data, error}

**Fonte única de verdade:** `/docs`
