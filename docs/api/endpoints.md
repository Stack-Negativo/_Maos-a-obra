# API — Endpoints

## Objetivo

Este documento descreve os endpoints iniciais da API REST do sistema.

O objetivo é:

- padronizar contratos
- definir payloads
- definir comportamento esperado
- servir como referência para implementação backend

---

# Convenções Gerais

## Prefixo

Todas as rotas devem utilizar:

```text
/api/v1
```

---

# Formato de Resposta

## Sucesso

```json
{
  "success": true,
  "data": {}
}
```

---

## Erro

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found"
  }
}
```

---

# Autenticação

## Estratégia

Autenticação baseada em JWT.

---

## Header esperado

```text
Authorization: Bearer <token>
```

---

# Status HTTP

| Situação | Status |
|---|---|
| sucesso | 200 |
| criação | 201 |
| sem conteúdo | 204 |
| inválido | 400 |
| não autenticado | 401 |
| proibido | 403 |
| não encontrado | 404 |
| conflito | 409 |

---

# Auth

---

# POST /api/v1/auth/register

## Objetivo

Cadastrar usuário.

---

## Request

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "Senha123",
  "telefone": "79999999999"
}
```

---

## Regras

- email único
- senha forte obrigatória

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

---

# POST /api/v1/auth/login

## Objetivo

Autenticar usuário.

---

## Request

```json
{
  "email": "joao@email.com",
  "senha": "Senha123"
}
```

---

## Response

```json
{
  "success": true,
  "data": {
    "access_token": "jwt",
    "token_type": "bearer"
  }
}
```

---

# GET /api/v1/auth/me

## Objetivo

Retornar usuário autenticado.

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

---

# Usuários

---

# GET /api/v1/users/me

## Objetivo

Retornar perfil do usuário autenticado.

---

# PATCH /api/v1/users/me

## Objetivo

Atualizar dados do usuário.

---

## Campos permitidos

- nome
- telefone

---

# Prestadores

---

# POST /api/v1/providers

## Objetivo

Criar perfil de prestador.

---

## Request

```json
{
  "descricao": "Eletricista residencial",
  "especialidades": [
    "uuid-especialidade"
  ]
}
```

---

## Regras

- usuário autenticado
- especialidade válida

---

# GET /api/v1/providers/me

## Objetivo

Retornar perfil do prestador autenticado.

---

# PATCH /api/v1/providers/me

## Objetivo

Atualizar perfil do prestador.

---

# GET /api/v1/providers/feed

## Objetivo

Retornar feed de OS elegíveis.

---

## Critérios

- especialidade compatível
- não suspenso
- sem conflito operacional

---

## Query Params futuros

| Campo | Tipo |
|---|---|
| latitude | float |
| longitude | float |
| raio | integer |

---

# Especialidades

---

# GET /api/v1/specialties

## Objetivo

Listar especialidades.

---

# Ordens de Serviço

---

# POST /api/v1/orders

## Objetivo

Criar OS.

---

## Request

```json
{
  "titulo": "Troca de chuveiro",
  "descricao": "Chuveiro queimado",
  "especialidade_id": "uuid",
  "endereco_id": "uuid",
  "valor_estimado": 150.00,
  "data_agendamento": "2026-05-20T14:00:00Z"
}
```

---

## Regras

- tomador autenticado
- especialidade válida
- data futura

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status_atual": "CRIADA"
  }
}
```

---

# GET /api/v1/orders

## Objetivo

Listar ordens do usuário autenticado.

---

## Query Params

| Campo | Tipo |
|---|---|
| status | string |
| page | integer |
| limit | integer |

---

# GET /api/v1/orders/{order_id}

## Objetivo

Detalhar OS.

---

# PATCH /api/v1/orders/{order_id}

## Objetivo

Atualizar OS.

---

## Restrições

Somente antes da seleção de prestador.

---

# DELETE /api/v1/orders/{order_id}

## Objetivo

Cancelar OS.

---

## Regras

- política de cancelamento
- participante válido

---

# Candidaturas

---

# POST /api/v1/orders/{order_id}/applications

## Objetivo

Candidatar-se à OS.

---

## Regras

- especialidade compatível
- sem duplicidade
- sem conflito operacional

---

# GET /api/v1/orders/{order_id}/applications

## Objetivo

Listar candidaturas da OS.

---

## Permissões

- tomador dono da OS
- administrador

---

# POST /api/v1/orders/{order_id}/applications/{application_id}/approve

## Objetivo

Selecionar prestador.

---

## Regras

- apenas um prestador
- OS válida

---

# POST /api/v1/orders/{order_id}/applications/{application_id}/reject

## Objetivo

Recusar candidatura.

---

# Agendamento

---

# POST /api/v1/orders/{order_id}/schedule

## Objetivo

Definir agendamento da OS.

---

## Request

```json
{
  "inicio_agendamento": "2026-05-20T14:00:00Z",
  "fim_agendamento": "2026-05-20T16:00:00Z"
}
```

---

## Regras

- sem conflito
- janela válida
- prestador selecionado

---

# Execução

---

# POST /api/v1/orders/{order_id}/start

## Objetivo

Iniciar execução da OS.

---

## Regras

- OS agendada
- horário válido

---

# POST /api/v1/orders/{order_id}/finish

## Objetivo

Marcar execução como concluída.

---

## Regras

- OS em execução

---

# POST /api/v1/orders/{order_id}/confirm

## Objetivo

Confirmar finalização pelo tomador.

---

## Consequências

- finaliza OS
- inicia pagamento

---

# Pagamentos

---

# GET /api/v1/payments

## Objetivo

Listar pagamentos do usuário.

---

# GET /api/v1/payments/{payment_id}

## Objetivo

Detalhar pagamento.

---

# POST /api/v1/payments/mock/process

## Objetivo

Simular processamento do gateway.

---

## Estratégia MVP

Endpoint interno de simulação.

---

## Request

```json
{
  "payment_id": "uuid",
  "status": "APROVADO"
}
```

---

# Avaliações

---

# POST /api/v1/orders/{order_id}/reviews

## Objetivo

Criar avaliação.

---

## Request

```json
{
  "tipo_avaliacao": "TOMADOR_PARA_PRESTADOR",
  "nota": 5,
  "comentario": "Excelente atendimento"
}
```

---

## Regras

- nota entre 1 e 5
- sem duplicidade
- OS finalizada

---

# GET /api/v1/orders/{order_id}/reviews

## Objetivo

Listar avaliações da OS.

---

# Notificações

---

# GET /api/v1/notifications

## Objetivo

Listar notificações do usuário.

---

# PATCH /api/v1/notifications/{notification_id}/read

## Objetivo

Marcar notificação como lida.

---

# Admin

---

# GET /api/v1/admin/providers/suspended

## Objetivo

Listar prestadores suspensos.

---

# POST /api/v1/admin/providers/{provider_id}/suspend

## Objetivo

Suspender prestador.

---

# POST /api/v1/admin/providers/{provider_id}/unsuspend

## Objetivo

Remover suspensão.

---

# Endpoints Futuros

Fluxos ainda não definidos completamente:

- disputa
- reembolso
- chat
- websocket
- geolocalização avançada
- ranking
- SLA
- antifraude

---

# Estratégia de Versionamento

## Padrão inicial

```text
/api/v1
```

---

## Evolução futura

Mudanças incompatíveis devem gerar:

```text
/api/v2
```

---

# Estratégia de Paginação

## Padrão

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

# Estratégia de Erros

## Formato padrão

```json
{
  "success": false,
  "error": {
    "code": "ORDER_ALREADY_FINISHED",
    "message": "Order already finished"
  }
}
```

---

# Estratégia de Segurança

## Regras iniciais

- JWT obrigatório
- rotas protegidas
- validação de ownership
- validação de permissões
- validação de status operacional

---

# Estratégia MVP

No MVP:

- pagamentos serão mockados
- notificações podem ser simplificadas
- geolocalização poderá ser parcial
- websocket não será implementado inicialmente
