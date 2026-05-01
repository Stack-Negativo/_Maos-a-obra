# Estado do Projeto

## Status Geral

- [x] Documentação base criada
- [x] DER definido
- [x] Fluxos definidos
- [x] Regras de negócio definidas
- [x] ADR inicial criado
- [x] Instruções de IA criadas
- [ ] Backend bootstrap
- [ ] Auth implementado
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
progress: 0%

---

### Prestadores
status: NOT_STARTED
dependencies: [Usuarios]
blocks: [Ordens_De_Servico]
progress: 0%

---

### Ordens_De_Servico
status: BLOCKED
dependencies: [Usuarios, Prestadores]
blocks: [Pagamentos, Revisoes]
progress: 0%

### Pagamentos (mock)
status: NOT_STARTED
dependencies: [Ordens_De_Servico]
progress: 0%

---

## Regras críticas implementadas

- nenhuma

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
