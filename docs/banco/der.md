# DER — Modelo de Dados

## Objetivo

Este documento descreve a modelagem técnica do banco de dados (PostgreSQL).

---

# Convenções de Nomenclatura (Technical Names)

- Tabelas e colunas em `snake_case`.
- Nomes em **Inglês** conforme `docs/arquitetura/nomenclatura.md`.
- Chaves primárias: `id` (UUID).
- Timestamps: `created_at`, `updated_at`, `deleted_at`.

---

# Entidades

---

## users

Entidade central de autenticação e dados básicos.

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| full_name | VARCHAR(255) | obrigatório |
| email | VARCHAR(255) | único, indexado |
| hashed_password | TEXT | obrigatório |
| phone | VARCHAR(20) | obrigatório |
| is_active | BOOLEAN | default true |
| is_email_verified | BOOLEAN | default false |
| last_login_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | obrigatório |
| updated_at | TIMESTAMP | obrigatório |

---

## clients

Papel de tomador de serviços.

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id), unique |

---

## providers

Papel de prestador de serviços.

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id), unique |
| bio | TEXT | nullable |
| rating_average | NUMERIC(3,2) | default 0 |
| is_suspended | BOOLEAN | default false |
| suspended_at | TIMESTAMP | nullable |

---

## admins

Papel de administrador do sistema.

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id), unique |
| access_level | INTEGER | obrigatório |

---

## specialties

Catálogo de especialidades.

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(255) | único |
| description | TEXT | nullable |
| is_active | BOOLEAN | default true |

---

## providers_specialties

Relacionamento N:N entre prestadores e especialidades.

| Campo | Tipo | Regra |
|---|---|---|
| provider_id | UUID | PK/FK providers(id) |
| specialty_id | UUID | PK/FK specialties(id) |
| linked_at | TIMESTAMP | obrigatório |

---

## addresses

Endereços vinculados a usuários (especialmente Clients).

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id) |
| label | VARCHAR(100) | ex: "Casa", "Trabalho" |
| zip_code | VARCHAR(20) | obrigatório |
| street | VARCHAR(255) | obrigatório |
| number | VARCHAR(20) | obrigatório |
| complement | VARCHAR(255) | nullable |
| neighborhood | VARCHAR(255) | obrigatório |
| city | VARCHAR(255) | obrigatório |
| state | VARCHAR(2) | obrigatório |
| latitude | NUMERIC(10,7) | nullable |
| longitude | NUMERIC(10,7) | nullable |

---

## service_orders

Representa a Ordem de Serviço (OS).

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR(50) | único (humano-legível) |
| client_id | UUID | FK clients(id) |
| provider_id | UUID | FK providers(id), nullable |
| specialty_id | UUID | FK specialties(id) |
| address_id | UUID | FK addresses(id) |
| title | VARCHAR(255) | obrigatório |
| description | TEXT | obrigatório |
| status | VARCHAR(50) | Enum: CREATED, etc. |
| estimated_value | NUMERIC(10,2) | nullable |
| preferred_date | TIMESTAMP | Data sugerida pelo Client |
| scheduled_at | TIMESTAMP | Data oficial acordada |
| finished_at | TIMESTAMP | nullable |
| cancelled_at | TIMESTAMP | nullable |
| cancellation_reason | TEXT | nullable |
| is_confirmed_by_client | BOOLEAN | default false |
| created_at | TIMESTAMP | obrigatório |

---

## applications

Candidaturas de Providers às Service Orders.

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| service_order_id | UUID | FK service_orders(id) |
| provider_id | UUID | FK providers(id) |
| message | TEXT | nullable |
| status | VARCHAR(50) | Enum: PENDING, ACCEPTED, etc. |
| applied_at | TIMESTAMP | obrigatório |

---

## schedules

Agenda operacional do Provider (bloqueios).

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| provider_id | UUID | FK providers(id) |
| service_order_id | UUID | FK service_orders(id) |
| starts_at | TIMESTAMP | obrigatório |
| ends_at | TIMESTAMP | obrigatório |
| status | VARCHAR(50) | Enum: CONFIRMED, etc. |

---

## payments (mock)

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| service_order_id | UUID | FK service_orders(id) |
| amount | NUMERIC(10,2) | obrigatório |
| payment_method | VARCHAR(50) | PIX, CARD, etc. |
| status | VARCHAR(50) | Enum: PENDING, etc. |
| transaction_id | VARCHAR(255) | nullable |
| confirmed_at | TIMESTAMP | nullable |

---

## reviews

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| service_order_id | UUID | FK service_orders(id) |
| reviewer_id | UUID | FK users(id) |
| reviewed_id | UUID | FK users(id) |
| direction | VARCHAR(50) | Enum: CLIENT_TO_PROVIDER, etc. |
| rating | INTEGER | 1-5 |
| comment | TEXT | nullable |
| created_at | TIMESTAMP | obrigatório |

---

## notifications

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id) |
| type | VARCHAR(50) | obrigatório |
| title | VARCHAR(255) | obrigatório |
| content | TEXT | obrigatório |
| is_read | BOOLEAN | default false |
| created_at | TIMESTAMP | obrigatório |
