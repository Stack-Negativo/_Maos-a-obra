# Anti-Padrões para Desenvolvimento Assistido por IA

## Objetivo

Este documento define práticas proibidas durante geração de código assistida por IA.

O objetivo é:

- evitar degradação arquitetural
- manter consistência
- reduzir acoplamento
- evitar overengineering
- preservar previsibilidade

---

# Anti-Padrões Proibidos

---

# AP01 — Regra de negócio em API

Nunca:

- validar fluxo operacional em endpoints
- implementar regras de domínio na camada API

---

# AP02 — Repository contendo regra operacional

Repositories não devem:

- validar negócio
- controlar fluxo
- aplicar regras operacionais

Repositories existem apenas para persistência.

---

# AP03 — Uso de HTTPException fora da API

Camadas internas não devem conhecer:

- HTTP
- FastAPI
- status code

---

# AP04 — ORM diretamente em endpoints

Endpoints nunca devem acessar:

- Session
- AsyncSession
- models SQLAlchemy diretamente

---

# AP05 — Mistura de sync/async

Nunca misturar:

- Session síncrona
- AsyncSession
- funções sync em fluxo async

---

# AP06 — Datetime naive

Nunca utilizar:

```python
datetime.now()
```

---

# AP07 - Uso de type: ignore

`# type: ignore` somente pode ser utilizado quando:

- existir limitação conhecida de typing externo
- existir incompatibilidade conhecida entre bibliotecas
- existir falso positivo comprovado

É proibido utilizar `# type: ignore` para:

- ocultar erro arquitetural
- ocultar problema de tipagem corrigível
- satisfazer linter sem investigação

Todo uso deve possuir comentário explicando o motivo.
