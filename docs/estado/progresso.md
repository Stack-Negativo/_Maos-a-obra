# Estado do Projeto

## Status Geral

- [x] Documentação base criada
- [x] DER definido
- [x] Fluxos definidos
- [x] Regras de negócio definidas
- [x] ADR inicial criado
- [x] Instruções de IA criadas
- [x] Backend bootstrap
- [x] Auth implementado
- [x] Especialidades (DONE)
- [x] Structural Alignment (DONE)
- [x] OS core implementado (DONE)
- [x] Candidaturas (DONE)
- [x] Agenda operacional (DONE)
- [/] Pagamentos Mock (Em implementação)

---

## Módulos

### Auth
status: DONE
dependencies: []
blocks: []
progress: 100%

---

### Usuarios
status: DONE
dependencies: [Auth]
blocks: [Prestadores, Ordens_De_Servico]
progress: 100%

---

### Especialidades
status: DONE
dependencies: []
blocks: [Prestadores, Ordens_De_Servico]
progress: 100%

---

### Endereços (Address)
status: DONE
dependencies: []
blocks: [Ordens_De_Servico]
progress: 100%

---

### Prestadores (Provider)
status: DONE
dependencies: [Especialidades]
blocks: [Ordens_De_Servico]
progress: 100%

---

### Ordens_De_Servico (Service Orders)
status: DONE
dependencies: [Prestadores, Especialidades, Endereços]
blocks: [Pagamentos, Revisoes]
progress: 100%
*   [x] CRUD básico
*   [x] State Machine
*   [x] Cancelamento
*   [x] Ciclo Operacional (IN_PROGRESS -> FINISHED)

### Candidaturas (Applications)
status: DONE
dependencies: [Ordens_De_Servico, Prestadores]
blocks: [Pagamentos, Agenda]
progress: 100%

### Agenda (Scheduling)
status: DONE
dependencies: [Candidaturas, Ordens_De_Servico]
progress: 100%

### Pagamentos (mock)
status: IN_PROGRESS
dependencies: [Ordens_De_Servico]
progress: 80%
*   [x] Service/Repo/API de Pagamento
*   [x] Idempotência e Auditoria
*   [ ] Integração com Fluxo de Finalização de OS

### Avaliações (Reviews)
status: NOT_STARTED
dependencies: [Ordens_De_Servico]
progress: 0%

---

## Regras críticas implementadas

- Padronização de Nomenclatura (PT/EN)
- Exclusividade de Papel (Admin vs Client/Provider)
- Desacoplamento de Agendamento (preferred vs scheduled)
- Infraestrutura de Exceptions Globais e Error Codes
- Gestão de Endereços com Regra de Único Padrão
- Módulo de Prestadores com Vínculo de Especialidades
- Regra de Exclusividade de Admin (Não pode ser Provider)
- Verificação de Elegibilidade de Prestadores
- Máquina de Estados de Ordens de Serviço (OrderStateMachine)
- Validação de Transições de Status e Estados Terminais
- Infraestrutura de Value Objects implementada (Money, DateRange, GeoCoordinates, AuditMetadata)
- Núcleo estrutural de Service Orders (Model, Repository, Service, API)
- Integração de Service Orders com State Machine e DateRange
- Automatização de Status CREATED -> AWAITING_CANDIDATES
- Regras de Cancelamento com Validação de Estado e Propriedade
- Formalização do Módulo de Candidaturas (Estados, Fluxos e Elegibilidade)
- Módulo de Candidaturas Completo (Criação, Listagem, Aceite Atômico)
- Regra de Seleção Única com Rejeição em Massa Atomicamente
- Bloqueio de Auto-Candidatura e Validação de Especialidade do Prestador
- Domínio preparado para Service Orders, Pagamentos e Agenda
- [x] **Finalização Operacional (Concluída):**
    - Implementação de `start_execution`, `complete_execution` e `confirm_execution`.
    - Garantia de transacionalidade em todo o ciclo de vida da OS.
    - Validação de ownership e regras de transição de estado.
    - Adição de rastreabilidade de conclusão via `provider_finished_at`.
- **Formalização e Implementação do Módulo de Agendamento (Concluída):**
    - Definição e implementação das regras RS01-RS07 para integridade temporal.
    - Implementação de `ProviderBusySlot` com suporte a `overlaps` eficientes.
    - Transição atômica `PROVIDER_SELECTED` -> `SCHEDULED` dentro de transação.
    - Garantia de uso obrigatório de UTC e Timezone-aware datetimes via `DateRange`.
    - API de agendamento e consulta de disponibilidade implementada e testada.
- **Auditoria Profunda de Service Orders (Concluída):**
    - Correção de precisão monetária: Migração de `float` para `Decimal` nos modelos e schemas.
    - Otimização de busca: Adição de índices em `preferred_date_start` e `preferred_date_end`.
    - Validação de integridade relacional e conformidade com SQLAlchemy 2.x.
    - Design validado para suportar os módulos futuros de `Applications` e `Scheduling`.
- Redução de risco de deriva arquitetural via Anti-Padrões de VOs
- Auditoria Arquitetural Completa: Consistência de Camadas, Tipagem SQLAlchemy 2.x e Async Correctness validados.
- **Endurecimento Arquitetural e Tipagem Estrita:**
    - Formalização da Política de Uso de Ignores (`type: ignore`, `pyright: ignore`, `noqa`).
    - Definição de padrões para Narrowing Explícito e Contratos de Repositories.
    - Implementação do Anti-Padrão AP10 — Ignore-Driven Development.

---

## Regras críticas pendentes

- [ ] **Integração de Pagamento:** Acionamento automático do `PaymentService` ao finalizar OS.
- [ ] **Módulo de Avaliações:** Implementar domínio completo de Reviews (RN05).
- [ ] **Auditoria de Status da OS:** Registro histórico de transições de status (RAD01).
- [ ] **Suspensão por Desempenho:** Lógica de monitoramento de média de estrelas (RN04).

---

## Bloqueios atuais

- Nenhum bloqueio crítico imediato.

---

## Auditoria de Higiene de Tipagem e Financeira (Concluída)

- [x] Formalização de eventos de domínio
- [x] Política de idempotência para operações financeiras
- [x] Preparação para arquitetura orientada a eventos (Event-Driven)
- [x] Preparação para integração com gateways externos

---

## Próximos Passos (Backend)

1.  **Módulo de Avaliações (Reviews):** Implementar Model, Repository, Service e API para avaliações 360.
2.  **Auditoria de Status (OS History):** Criar mecanismo de log para transições de status da OS.
3.  **Integração de Pagamento:** Vincular a finalização operacional ao processamento do pagamento mock.
4.  **Regras de Performance:** Implementar lógica de suspensão automática baseada em avaliações.
