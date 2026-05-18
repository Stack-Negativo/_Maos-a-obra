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

# AP07 — Primitivos em vez de Value Objects

É proibido utilizar tipos primitivos para representar conceitos semânticos complexos do domínio.

**Incorreto (Primitivos):**
- Usar `float` para dinheiro.
- Usar `datetime` naive (sem timezone).
- Usar `utcnow()` diretamente no código operacional.
- Usar `tuple` ou `list` para coordenadas geográficas.
- Validar ranges temporais (start < end) diretamente em endpoints ou repositories.
- Lógica de "overlap" de datas espalhada em Services.
- Usar `dict` genérico para metadados de auditoria.

**Correto (Value Objects):**
- Usar `Money` (VO) para qualquer valor monetário.
- Usar `DateRange` (VO) para intervalos de tempo.
- Usar `GeoCoordinates` (VO) para localização.
- Usar `AuditMetadata` (VO) para rastreabilidade.

---

# AP09 — Lógica de VO fora do Domínio

Nunca implemente lógica de cálculo monetário ou validação de intervalo temporal fora do respectivo Value Object. Services devem apenas orquestrar o uso desses objetos.

---

# AP10 — Ignore-Driven Development

É proibido utilizar supressões de erro (`type: ignore`, `pyright: ignore`, `noqa`) como atalho para acelerar a implementação ou esconder falhas arquiteturais.

**Incorreto (Prática Proibida):**
- Adicionar `# type: ignore` em um erro de `Optional` em vez de usar um guard explicito.
- Silenciar o BasedPyright em regras de transição de status da State Machine.
- Ignorar erros de tipagem em ownership checks ou validações financeiras.
- Usar ignores sem comentário justificando o motivo técnico.

**Correto (Padrão do Projeto):**
- Resolver o erro de tipagem através de refatoração ou guardas explícitos.
- Usar supressões apenas para limitações técnicas externas (ex: SQLAlchemy mapper side-effects).
- Sempre documentar o motivo do ignore com comentário explicativo.
- Consultar a [Política de Tipagem Estrita](/docs/arquitetura/tipagem-e-ignores.md) para casos permitidos.

---

# AP11 — Agendamento sem transação

É proibido realizar a mudança de status para `SCHEDULED` e a criação de slots de agenda em transações separadas ou fora de um contexto transacional.

---

# AP12 — Overlap validado fora da transação

A verificação de sobreposição de horários deve ocorrer obrigatoriamente dentro da transação que persiste o agendamento, para evitar race conditions onde dois agendamentos ocupam o mesmo slot.

---

# AP13 — Uso de datetime naive

É terminantemente proibido o uso de `datetime` sem timezone (naive) em qualquer parte do módulo de agendamento. Todo cálculo e persistência deve ser em UTC.

---

# AP14 — Regras temporais fora de Value Objects

Validações de intervalo (start < end) ou lógica de sobreposição não devem ser implementadas em Services ou Repositories. Essas responsabilidades pertencem exclusivamente ao Value Object `DateRange`.
