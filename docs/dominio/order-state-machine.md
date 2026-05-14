# State Machine — Service Orders

## Objetivo

Define as transições de estado permitidas para as Ordens de Serviço.

---

# Estados (Status)

- `CREATED`: OS criada pelo Cliente.
- `AWAITING_CANDIDATES`: OS visível no feed.
- `AWAITING_SELECTION`: Possui ao menos uma candidatura.
- `PROVIDER_SELECTED`: Cliente escolheu o prestador.
- `SCHEDULED`: Data e hora oficial confirmada.
- `IN_PROGRESS`: Serviço sendo executado.
- `FINISHED`: Serviço concluído e confirmado.
- `CANCELLED`: Cancelada por uma das partes.
- `EXPIRED`: Ninguém se candidatou no prazo.

---

# Transições Permitidas

| De | Para | Gatilho |
|---|---|---|
| `CREATED` | `AWAITING_CANDIDATES` | Automaticamente após criação. |
| `AWAITING_CANDIDATES` | `AWAITING_SELECTION` | Primeira candidatura recebida. |
| `AWAITING_SELECTION` | `PROVIDER_SELECTED` | Cliente aceita uma candidatura. |
| `PROVIDER_SELECTED` | `SCHEDULED` | Horário oficial registrado. |
| `SCHEDULED` | `IN_PROGRESS` | Provider inicia o serviço. |
| `IN_PROGRESS` | `FINISHED` | Provider finaliza + Cliente confirma. |
| Qualquer (exceto Final) | `CANCELLED` | Solicitação de cancelamento. |
