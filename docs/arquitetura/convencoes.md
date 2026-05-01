# Convenções de Desenvolvimento

## Objetivo

Este documento define padrões técnicos, arquiteturais e organizacionais obrigatórios para o backend.

Todos os desenvolvedores e agentes de IA devem seguir estas convenções.

O objetivo é garantir:

- consistência
- legibilidade
- escalabilidade
- manutenibilidade
- previsibilidade

---

# Stack Oficial

## Linguagem

- Python 3.12

---

## Framework Web

- FastAPI

---

## ORM

- SQLAlchemy 2.x

---

## Banco de Dados

- PostgreSQL

---

## Validação

- Pydantic v2

---

## Migrations

- Alembic

---

## Containers

- Docker
- Docker Compose

---

# Estrutura Oficial do Projeto

```text
backend/
├── api/
├── domain/
├── repositories/
├── schemas/
├── services/
├── models/
├── core/
├── tests/
└── migrations/
```

---

# Responsabilidade das Pastas

---

# api/

Responsável por:

- rotas HTTP
- dependências
- autenticação
- autorização
- responses

---

## Proibido

- SQL
- regras de negócio
- lógica operacional

---

# services/

Responsável por:

- regras de negócio
- orquestração
- validações de domínio
- fluxo operacional

---

# repositories/

Responsável por:

- queries
- persistência
- acesso ao banco

---

## Proibido

- regras de negócio
- validações de domínio

---

# schemas/

Responsável por:

- requests
- responses
- DTOs
- serialização

---

# domain/

Responsável por:

- enums
- constantes
- tipos
- contratos
- regras centrais

---

# models/

Responsável por:

- modelos SQLAlchemy

---

# core/

Responsável por:

- configuração
- segurança
- logging
- exceptions
- utilidades centrais

---

# tests/

Responsável por:

- testes unitários
- testes de integração
- fixtures

---

# Convenções Python

---

# CP01 — Tipagem obrigatória

Toda função deve possuir tipagem explícita.

---

## Correto

```python
async def get_user(user_id: UUID) -> User:
    ...
```

---

## Incorreto

```python
async def get_user(user_id):
    ...
```

---

# CP02 — Async obrigatório

Toda operação I/O deve ser assíncrona.

---

## Exemplos

- banco
- HTTP externo
- cache
- fila

---

# CP03 — Imports absolutos

Sempre utilizar imports absolutos.

---

## Correto

```python
from app.services.user_service import UserService
```

---

## Evitar

```python
from ..services.user_service import UserService
```

---

# CP04 — Docstrings obrigatórias em services públicos

Métodos públicos de services devem possuir docstrings.

---

# CP05 — Evitar lógica procedural

Preferir:

- serviços pequenos
- métodos coesos
- separação clara

---

# Convenções FastAPI

---

# CF01 — Prefixo padrão

Todas rotas devem utilizar:

```text
/api/v1
```

---

# CF02 — Response models obrigatórios

Toda rota deve possuir schema de resposta.

---

# CF03 — Status HTTP semântico

## Exemplos

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

# CF04 — Dependency Injection obrigatória

Toda dependência deve utilizar `Depends`.

---

# CF05 — Controllers magros

Rotas devem apenas:

- receber request
- chamar service
- retornar response

---

# Convenções SQLAlchemy

---

# CS01 — SQLAlchemy 2.x style obrigatório

Utilizar padrão moderno.

---

## Correto

```python
stmt = select(User)
```

---

## Evitar

```python
session.query(User)
```

---

# CS02 — AsyncSession obrigatório

Toda operação deve utilizar `AsyncSession`.

---

# CS03 — Models desacoplados

Models não devem conter regras de negócio.

---

# CS04 — UUID obrigatório

Todas entidades principais devem utilizar UUID.

---

# CS05 — Soft delete inicialmente não utilizado

No MVP:

- exclusão física permitida
- auditoria será mantida separadamente

---

# Convenções Pydantic

---

# CPY01 — Schemas separados

Separar:

- Create
- Update
- Response

---

## Exemplo

```text
UserCreateSchema
UserUpdateSchema
UserResponseSchema
```

---

# CPY02 — Nunca expor dados sensíveis

Nunca retornar:

- senha_hash
- tokens internos
- secrets

---

# CPY03 — Configuração ORM obrigatória

Utilizar:

```python
model_config = ConfigDict(from_attributes=True)
```

---

# Convenções de Banco

---

# CB01 — snake_case obrigatório

Tabelas e colunas devem utilizar:

```text
snake_case
```

---

# CB02 — Timestamps UTC

Todos timestamps devem ser UTC.

---

# CB03 — Índices obrigatórios

Campos críticos devem possuir índices.

---

## Exemplos

- email
- foreign keys
- status
- data_agendamento

---

# CB04 — Constraints obrigatórias

Sempre utilizar:

- unique
- foreign key
- check constraints

---

# CB05 — Histórico operacional obrigatório

Mudanças críticas devem gerar auditoria.

---

# Convenções de Services

---

# CVS01 — Service por domínio

## Exemplos

```text
UserService
OrderService
PaymentService
```

---

# CVS02 — Services não acessam models diretamente

Services devem utilizar repositories.

---

# CVS03 — Regras centralizadas

Toda regra deve existir em services.

---

# CVS04 — Services pequenos

Evitar services gigantes.

---

# Convenções de Repositories

---

# CR01 — Repository por agregado

## Exemplos

```text
UserRepository
OrderRepository
```

---

# CR02 — Repositories não conhecem HTTP

Repositories não devem lançar:

- HTTPException
- responses HTTP

---

# CR03 — Repositories retornam entidades

Evitar retornar dicionários crus.

---

# Convenções de Segurança

---

# SEG01 — Senhas sempre hasheadas

Utilizar algoritmo seguro.

---

## Recomendado

- bcrypt
- argon2

---

# SEG02 — JWT obrigatório

Autenticação baseada em JWT.

---

# SEG03 — Nunca confiar no frontend

Toda validação crítica deve ocorrer no backend.

---

# SEG04 — Rate limiting futuro

Sistema deverá suportar:

- throttling
- rate limiting
- proteção antifraude

---

# Convenções de Logs

---

# LOG01 — Eventos importantes devem ser logados

## Exemplos

- login
- cancelamento
- pagamento
- suspensão

---

# LOG02 — Nunca logar dados sensíveis

Nunca logar:

- senhas
- tokens
- secrets

---

# Convenções de Testes

---

# TEST01 — Services obrigatoriamente testados

Toda regra de negócio crítica deve possuir testes.

---

# TEST02 — Repositories devem possuir integração

Queries críticas devem possuir testes de integração.

---

# TEST03 — Fixtures reutilizáveis

Criar fixtures padronizadas.

---

# TEST04 — Não utilizar banco real nos testes unitários

Preferir:

- mocks
- fakes
- factories

---

# Convenções de Migrations

---

# MIG01 — Toda alteração estrutural exige migration

Nunca alterar schema manualmente.

---

# MIG02 — Migrations devem ser reversíveis

Sempre implementar downgrade.

---

# MIG03 — Nome descritivo obrigatório

## Correto

```text
create_orders_table
```

---

## Evitar

```text
migration_01
```

---

# Convenções para IA

---

# IA01 — Nunca criar regra fora da documentação

A IA deve respeitar:

- regras de negócio
- fluxos
- convenções

---

# IA02 — Nunca acessar banco fora de repositories

Obrigatório respeitar separação arquitetural.

---

# IA03 — Nunca colocar regra em routes

Toda regra deve existir em services.

---

# IA04 — Toda implementação deve considerar tipagem

Código sem tipagem é inválido.

---

# IA05 — Sempre preferir coesão

Preferir:

- arquivos menores
- métodos pequenos
- responsabilidades claras

---

# Convenções Futuras

Fluxos ainda sujeitos a refinamento:

- websocket
- notificações push
- filas
- cache distribuído
- antifraude
- observabilidade
- tracing
- métricas
- monitoramento
