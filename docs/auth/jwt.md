# Estratégia JWT

## Objetivo

Este documento define a estratégia de autenticação JWT do sistema.

O objetivo é:

- autenticação stateless
- simplicidade operacional no MVP
- desacoplamento do domínio
- extensibilidade futura
- compatibilidade com arquitetura async

---

# Estratégia Inicial

O sistema utilizará:

```text
JWT Access Token
