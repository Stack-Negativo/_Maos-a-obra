# Estratégia de Eventos e Idempotência

## 1. Objetivo

Este documento formaliza a estratégia de comunicação entre módulos e a garantia de operações seguras para o sistema "Mãos à Obra". O objetivo é preparar o terreno para:

*   **Desacoplamento:** Permitir que módulos operacionais (ex: Scheduling) e financeiros (ex: Payments) se comuniquem sem conhecimento direto de implementação.
*   **Preparação para Gateways:** Facilitar a transição de um modelo de "Pagamento Mock" para um gateway real (Stripe, PagSeguro, etc.) que opera de forma assíncrona.
*   **Prevenção de Inconsistências:** Garantir que falhas de rede, retries de clientes e concorrência não gerem estados inválidos (ex: cobrança dupla ou OS paga sem agendamento).
*   **Escalabilidade:** Preparar o sistema para evoluir de um monolito síncrono para uma arquitetura orientada a eventos (Event-Driven) sem reescrita de lógica de negócio.

## 2. Conceito de Domain Events

Eventos de Domínio são fatos imutáveis que ocorreram no passado dentro de um contexto de negócio. 

### Características
*   **Imutabilidade:** Uma vez ocorrido, o evento não pode ser alterado.
*   **Passado:** O nome do evento deve refletir um fato concluído (ex: `OrderCreated` e não `CreateOrder`).
*   **Desacoplamento de Side-Effects:** O emissor do evento (ex: `OrderService`) não sabe quem o escuta. Ele apenas anuncia que algo aconteceu.
*   **Rastreabilidade:** Eventos servem como a base para o histórico de auditoria e reconstrução de estado.

## 3. Eventos Oficiais do Sistema

Os eventos são divididos em categorias para facilitar a organização e o consumo.

### 🟢 Eventos Operacionais (Core Domain)
Representam mudanças no ciclo de vida da Ordem de Serviço e fluxos de candidatos.

| Evento | Contexto | Descrição |
| :--- | :--- | :--- |
| `OrderCreated` | `ServiceOrder` | Uma nova OS foi aberta no sistema. |
| `ApplicationSubmitted` | `Application` | Um prestador enviou uma candidatura para uma OS. |
| `ProviderSelected` | `Application` | Um cliente aceitou uma candidatura específica. |
| `OrderScheduled` | `Scheduling` | A OS foi vinculada a um slot de tempo confirmado. |
| `OrderCancelled` | `ServiceOrder` | A OS foi encerrada por cancelamento (pelo cliente ou prestador). |
| `OrderFinished` | `ServiceOrder` | A execução foi concluída e o processo de fechamento iniciado. |

### 🔵 Eventos Financeiros (Payment Domain)
Representam o ciclo de vida do fluxo de caixa e transações.

| Evento | Contexto | Descrição |
| :--- | :--- | :--- |
| `PaymentRequested` | `Payment` | O sistema iniciou a intenção de cobrança para uma OS. |
| `PaymentProcessingStarted` | `Payment` | O processamento foi enviado ao provedor (ou mock). |
| `PaymentApproved` | `Payment` | O recurso foi confirmado e o valor está garantido. |
| `PaymentDeclined` | `Payment` | O provedor recusou a transação (ex: saldo insuficiente). |
| `PaymentRefunded` | `Payment` | O valor foi devolvido ao tomador devido a cancelamento/problema. |

## 4. Estratégia Atual (Monolito Síncrono)

Atualmente, o sistema opera de forma **síncrona e monolítica**.

*   **Execução:** Quando um serviço chama outro (ex: `OrderService` chamando `PaymentService`), a execução ocorre na mesma thread/transação de banco de dados.
*   **Comunicação de Eventos:** Não há um broker (como RabbitMQ ou Kafka). A "notificação" de um evento ocorre via chamadas de método diretas ou atualização de estado no banco de dados.
*   **Consistência:** A consistência é garantida via transações ACID do PostgreSQL dentro de cada request.

## 5. Estratégia Futura (Arquitetura Orientada a Eventos)

O design atual permite a evolução para um modelo assíncrono sem alterar a lógica de negócio:

1.  **Outbox Pattern:** Para garantir que um evento de domínio seja enviado apenas se a transação do banco de dados tiver sucesso.
2.  **Mensageria (Pub/Sub):** Introdução de um broker (RabbitMQ/Kafka) para distribuir eventos para workers externos.
3.  **Processamento Assíncrono:** Transições de estado que dependem de confirmações externas (como pagamentos reais) passarão a ser processadas via workers, reagindo a eventos de retorno do gateway.
4.  **Retries e DLQ:** Implementação de políticas de re-tentativa automática para eventos que falharam no processamento (ex: falha de notificação).

## 6. Idempotência

Para prevenir efeitos colaterais de duplicidade (especialmente em operações financeiras), o sistema adota a seguinte política:

### Regras Obrigatórias
*   **Client-Side Idempotency Key:** Endpoints que realizam mutações críticas (como `POST /payments/process`) **devem** aceitar uma `idempotency_key` enviada pelo cliente.
*   **Cache de Resultado:** O servidor deve registrar a chave de idempotência e o resultado da primeira execução. Requisições subsequentes com a mesma chave devem retornar o resultado armazenado sem re-executar a lógica.
*   **Operações Financeiras:** Nenhuma operação de débito/crédito ou mudança de status de pagamento pode ser executada sem a verificação prévia de uma chave de idempotência ou estado de transação.

## 7. Race Conditions e Concorrência

A estratégia de mitigação foca nos seguintes cenários:

*   **Cancelamento vs. Pagamento:** A transição de estado da OS para `CANCELLED` deve ser protegida por bloqueios de linha (`SELECT FOR UPDATE`) para evitar que um processo de pagamento ocorra simultaneamente à mudança de estado.
*   **Double Submit:** O uso de `idempotency_key` no nível da API resolve o problema de cliques duplos ou retries de rede.
*   **Concorrência de Agendamento:** Já mitigada pela estratégia de `ProviderBusySlot` e transações atômicas no módulo de Scheduling.

## 8. Coordenação de Estados (OS $\leftrightarrow$ Payment)

A sincronização entre o domínio operacional e o financeiro seguirá o modelo de **Reação por Evento**:

1.  **Coordenação:** O `OrderService` é o coordenador principal.
2.  **Fluxo de Reação:**
    *   `OrderService` $\to$ altera status para `AWAITING_PAYMENT` $\to$ dispara `PaymentRequested`.
    *   `PaymentService` $\to$ processa $\to$ dispara `PaymentApproved`.
    *   `OrderService` (ouvindo `PaymentApproved`) $\to$ altera status para `PAID` $\to$ inicia fluxo de execução.
3.  **Prevenção de Loops:** Cada mudança de estado deve ser validada contra a `OrderStateMachine` para garantir que uma resposta de pagamento não force uma transição proibida.

## 9. Garantias Transacionais

*   **Atomicidade:** Mudanças de estado e a emissão do evento (no modelo atual, a atualização do registro) ocorrem na mesma transação de banco de dados.
*   **Consistência:** O sistema garante que um objeto de domínio nunca transite para um estado que viole suas regras de negócio (ex: não se pode agendar uma OS sem pagamento se a regra de negócio assim exigir).
*   **Integridade Temporal:** O uso de `DateRange` e timestamps em UTC garante que a ordem dos eventos e a validade dos períodos sejam preservadas.

## 10. Anti-Padrões (Novos)

| ID | Nome | Descrição |
| :--- | :--- | :--- |
| **AP20** | **Side Effects Distribuídos Sem Evento** | Realizar chamadas de rede ou alterações em outros módulos sem o registro formal de um evento de domínio. |
| **AP21** | **Processamento Financeiro Não Idempotente** | Implementar operações de cobrança ou estorno que não validam chaves de idempotência, permitindo duplicidade em retries. |
| **AP22** | **Estados Operacionais Sem Sincronização Financeira** | Permitir que uma Ordem de Serviço avance para estados de execução sem a confirmação de um evento de pagamento correspondente. |
| **AP23** | **Acoplamento Direto Entre Gateway e Domínio** | Permitir que detalhes de implementação de um provedor de pagamento (ex: campos específicos da API da Stripe) vazem para as camadas de `domain/` ou `services/`. |
