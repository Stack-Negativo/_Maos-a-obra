# Estratégia de Exceptions

## Objetivo

Este documento define a estratégia oficial de tratamento de erros do backend.

O objetivo é:

- padronizar falhas
- evitar vazamento de infraestrutura
- desacoplar domínio de HTTP
- melhorar previsibilidade
- facilitar integração com IA

---

# Princípios

---

# P01 — Domínio desacoplado de HTTP

Camadas internas não devem conhecer:

- HTTPException
- status HTTP
- FastAPI Response

---

# P02 — Exceptions representam regras do domínio

Exceptions devem representar:

- falhas operacionais
- violações de regra
- estados inválidos
- conflitos

---

# P03 — API traduz exceptions

Somente a camada API deve transformar exceptions em responses HTTP.

---

# Hierarquia Base

---

# BaseException

Exception raiz do sistema.

---

# DomainException

Representa erro de negócio.

---

# ValidationException

Representa erro de validação.

---

# NotFoundException

Representa entidade inexistente.

---

# ConflictException

Representa conflito operacional.

---

# AuthenticationException

Representa falha de autenticação.

---

# AuthorizationException

Representa falha de autorização.

---

# InfrastructureException

Representa falha técnica.

---

# BusinessRuleViolation

Representa quebra explícita de regra do domínio.

---

# Exemplos

---

## Exemplos de ValidationException

- email inválido
- senha fraca
- nota fora do intervalo

---

## Exemplos de ConflictException

- candidatura duplicada
- email já cadastrado
- conflito de agenda

---

## Exemplos de BusinessRuleViolation

- pagamento antes da confirmação
- execução sem agendamento
- cancelamento inválido

---

# Mapeamento HTTP

| Exception | HTTP |
|---|---|
| ValidationException | 400 |
| AuthenticationException | 401 |
| AuthorizationException | 403 |
| NotFoundException | 404 |
| ConflictException | 409 |
| BusinessRuleViolation | 422 |
| InfrastructureException | 500 |

---

# Estrutura de Response

## Formato padrão

```json
{
  "detail": "Mensagem de erro",
  "error_code": "CODIGO_ERRO",
  "timestamp": "2026-01-01T00:00:00Z"
}
