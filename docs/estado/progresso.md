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
- [ ] OS core implementado

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

### Candidaturas (Applications)
status: IN_PROGRESS
dependencies: [Ordens_De_Servico, Prestadores]
blocks: [Pagamentos, Agenda]
progress: 20%

### Pagamentos (mock)

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
- Domínio preparado para Service Orders, Pagamentos e Agenda
- **Auditoria Profunda de Service Orders (Concluída):**
    - Correção de precisão monetária: Migração de `float` para `Decimal` nos modelos e schemas.
    - Otimização de busca: Adição de índices em `preferred_date_start` e `preferred_date_end`.
    - Validação de integridade relacional e conformidade com SQLAlchemy 2.x.
    - Design validado para suportar os módulos futuros de `Applications` e `Scheduling`.
- Redução de risco de deriva arquitetural via Anti-Padrões de VOs
- Auditoria Arquitetural Completa: Consistência de Camadas, Tipagem SQLAlchemy 2.x e Async Correctness validados.

---

## Regras críticas pendentes

- fluxo de OS (em andamento)
- agenda do prestador
- candidatura
- seleção
- finalização

- agenda do prestador
- candidatura
- seleção
- finalização

---

## Bloqueios atuais

- Necessário implementar Address e Provider antes de Service Orders.

---

## Ordem recomendada de execução

1. backend bootstrap (DONE)
2. auth (DONE)
3. users (DONE)
4. specialties (DONE)
5. structural alignment (DONE)
6. addresses
7. providers
8. service orders
9. candidaturas
10. agenda
11. pagamentos mock
12. avaliações
