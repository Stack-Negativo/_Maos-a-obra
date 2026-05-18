# Módulo de Agendamento (Scheduling)

## Objetivo do Módulo

O módulo de Agendamento é responsável por gerenciar a agenda operacional dos prestadores, garantindo a integridade temporal dos serviços e a disponibilidade dos profissionais.

Suas principais responsabilidades incluem:
- **Agendamento Oficial:** Registrar o horário definitivo de execução de uma Ordem de Serviço (OS).
- **Controle de Disponibilidade:** Gerenciar os períodos em que um prestador está ocupado.
- **Prevenção de Conflitos:** Garantir que não existam sobreposições de horários (overlap).
- **Integridade Temporal:** Assegurar que agendamentos respeitem as janelas operacionais e regras de deslocamento.
- **Suporte Futuro:** Preparar a base para notificações automáticas e fluxos de pagamento vinculados à execução.

---

## Conceitos do Domínio

### ProviderSchedule (Agenda do Prestador)

Representa a visão consolidada de todos os períodos ocupados de um prestador específico. Não é necessariamente uma tabela única, mas um conceito que agrega diferentes origens de ocupação.

### Busy Slot (Slot de Ocupação)

Um período temporal reservado na agenda do prestador.
Um Busy Slot deve conter:
- **Início:** Datetime UTC.
- **Fim:** Datetime UTC.
- **Origem:** Identificação do que gerou o bloqueio (ex: "SERVICE_ORDER", "MANUAL_BLOCK").
- **Status:** Estado atual do slot (ex: "CONFIRMED", "TENTATIVE").
- **Referência:** Opcionalmente, o ID da Ordem de Serviço relacionada.

---

## Estados Relacionados (Order State Machine)

O agendamento está intrinsecamente ligado à transição de estados da Ordem de Serviço:

1. **PROVIDER_SELECTED**: O agendamento só pode ocorrer após um prestador ter sido selecionado pelo cliente.
2. **SCHEDULED**: O estado que indica que a OS possui um horário oficial e um slot reservado na agenda do prestador.
3. **IN_PROGRESS**: O início da execução confirma que o agendamento foi cumprido.

### Validações Obrigatórias para Agendar
- A OS deve estar em `PROVIDER_SELECTED`.
- O prestador selecionado deve ter disponibilidade no período (sem overlap).
- O agendamento deve ser realizado pelo Cliente (dono da OS) ou pelo Prestador selecionado.

---

## Estratégia de Concorrência

### O Problema
Em sistemas de alta concorrência, dois clientes podem tentar agendar o mesmo prestador para horários sobrepostos simultaneamente, ou um prestador pode tentar criar um bloqueio manual enquanto uma OS está sendo agendada.

### Estratégia Oficial
Para garantir a integridade da agenda, a estratégia de concorrência deve seguir estes requisitos:

- **Transações Obrigatórias:** Toda operação de agendamento ou criação de Busy Slot deve ocorrer dentro de uma transação de banco de dados.
- **Verificação de Overlap Interna:** A validação de disponibilidade (`DateRange.overlaps()`) deve ser executada obrigatoriamente *dentro* da transação que realiza a reserva.
- **Locking:** O sistema deve estar preparado para implementar locks (pessimistas ou constraints temporais de banco) para evitar *race conditions* entre a verificação de disponibilidade e a persistência do slot.
- **Atomicidade:** A mudança de status da OS para `SCHEDULED` e a criação do Busy Slot correspondente devem ser atômicas.

---

## Integração com Value Objects

O módulo de agendamento depende fundamentalmente dos seguintes VOs:

- **DateRange:** Utilizado para representar o período do agendamento, realizar cálculos de duração e detectar sobreposições.
- **AuditMetadata:** Utilizado para registrar quem realizou o agendamento e quando, permitindo auditoria futura de alterações na agenda.

---

## Integração Futura com Event-Driven

O módulo deverá emitir eventos internos para permitir que outras partes do sistema reajam a mudanças na agenda:

- `OrderScheduled`: Emitido quando uma OS é agendada com sucesso.
- `OrderRescheduled`: Emitido em caso de alteração de horário.
- `OrderCancelled`: Emitido quando o cancelamento da OS deve liberar o slot na agenda.
- `ProviderBusySlotCreated`: Emitido para bloqueios manuais ou indisponibilidades.

*Nota: A implementação de brokers (Kafka/RabbitMQ) não faz parte do escopo atual, apenas a definição dos eventos de domínio.*
