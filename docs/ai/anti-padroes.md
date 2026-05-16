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

# AP08 — Lógica de VO fora do Domínio

Nunca implemente lógica de cálculo monetário ou validação de intervalo temporal fora do respectivo Value Object. Services devem apenas orquestrar o uso desses objetos.
