# Dicionário de Nomenclatura e Tradução

## Objetivo

Este documento define a tradução oficial entre os termos de negócio (em Português) e a implementação técnica (em Inglês).

Deve ser seguido rigorosamente para manter a consistência entre a documentação e o código.

---

# Entidades Principais

| Português (Domínio) | Inglês (Técnico) | Tabela Banco |
|----------------------|------------------|--------------|
| Usuário              | User             | users        |
| Tomador / Cliente    | Client           | clients      |
| Prestador            | Provider         | providers    |
| Administrador        | Admin            | admins       |
| Especialidade        | Specialty        | specialties  |
| Ordem de Serviço (OS)| Service Order    | service_orders|
| Candidatura          | Application      | applications |
| Agendamento / Agenda | Schedule         | schedules    |
| Endereço             | Address          | addresses    |
| Pagamento            | Payment          | payments     |
| Avaliação            | Review           | reviews      |
| Notificação          | Notification     | notifications|

---

# Atributos Comuns

| Português | Inglês |
|-----------|--------|
| Nome      | name   |
| Senha     | password / hashed_password |
| Ativo     | is_active |
| Criado em | created_at |
| Atualizado em | updated_at |
| Excluído em | deleted_at |
| Descrição | description |

---

# Status e Enums

## Status da OS (Service Order Status)

| Português | Inglês |
|-----------|--------|
| CRIADA    | CREATED |
| AGUARDANDO_CANDIDATOS | AWAITING_CANDIDATES |
| AGUARDANDO_ESCOLHA | AWAITING_SELECTION |
| PRESTADOR_SELECIONADO | PROVIDER_SELECTED |
| AGENDADA | SCHEDULED |
| EM_EXECUCAO | IN_PROGRESS |
| FINALIZADA | FINISHED |
| CANCELADA | CANCELLED |
| EXPIRADA | EXPIRED |

## Status da Candidatura (Application Status)

| Português | Inglês |
|-----------|--------|
| PENDENTE  | PENDING |
| ACEITA    | ACCEPTED |
| RECUSADA  | REJECTED |
| CANCELADA | CANCELLED |

## Status do Pagamento (Payment Status)

| Português | Inglês |
|-----------|--------|
| PENDENTE  | PENDING |
| PROCESSANDO | PROCESSING |
| APROVADO  | APPROVED |
| RECUSADO  | DECLINED |
| ESTORNADO | REFUNDED |

---

# Datas de Agendamento (Estratégia de Desacoplamento)

| Termo em Português | Termo em Inglês | Uso |
|---------------------|-----------------|-----|
| Data Desejada       | preferred_date  | Definida pelo Cliente na criação. |
| Data Agendada       | scheduled_at    | Definida após aceite e negociação. |
