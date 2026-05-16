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
status: UNBLOCKED
dependencies: [Especialidades]
blocks: [Ordens_De_Servico]
progress: 0%

---

### Ordens_De_Servico (Service Orders)
status: BLOCKED
dependencies: [Prestadores, Especialidades, Endereços]
blocks: [Pagamentos, Revisoes]
progress: 0%

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

---

## Regras críticas pendentes

- fluxo de OS
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
