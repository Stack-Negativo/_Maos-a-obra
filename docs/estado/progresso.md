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
status: NOT_STARTED
dependencies: []
blocks: [Usuarios]
progress: 0%

---

### Usuarios
status: BLOCKED
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
status: UNBLOCKED
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
- Módulo de Prestadores com Vínculo de Especialidades
- Regra de Exclusividade de Admin (Não pode ser Provider)
- Verificação de Elegibilidade de Prestadores

---

## Regras críticas pendentes

- fluxo de OS
- agenda do prestador
- candidatura
- seleção
- finalização

---

## Bloqueios atuais

- backend não inicializado
- models não criados
- migrations não configuradas

---

## Ordem recomendada de execução

1. backend bootstrap
2. auth
3. users
4. providers
5. specialties
6. orders
7. candidaturas
8. agenda
9. pagamentos mock
10. avaliações
