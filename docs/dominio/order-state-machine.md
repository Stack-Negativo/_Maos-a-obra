# State Machine — Ordens de Serviço

## Objetivo

Este documento define oficialmente a máquina de estados das Ordens de Serviço (OS).

Toda implementação backend deverá respeitar integralmente estas transições.

---

# Objetivos

A state machine existe para:

- evitar transições inválidas
- garantir previsibilidade operacional
- centralizar fluxo do domínio
- facilitar auditoria
- reduzir inconsistência

---

# Estados Oficiais

---

# Estados iniciais

```text
CRIADA
AGUARDANDO_CANDIDATOS
AGUARDANDO_ESCOLHA_TOMADOR
