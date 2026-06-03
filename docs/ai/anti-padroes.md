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

| ID | Nome | Descrição |
| :--- | :--- | :--- |
| AP01 | Regra de negócio em API | Implementar lógica de decisão em endpoints HTTP. |
| AP02 | Repository contendo regra operacional | Colocar lógica de negócio dentro de métodos de persistência. |
| AP03 | Uso de HTTPException fora da API | Lançar exceções HTTP de transporte em camadas de domínio ou serviço. |
| AP04 | ORM diretamente em endpoints | Realizar queries SQL/ORM dentro dos controllers da API. |
| AP05 | Mistura de sync/async | Misturar código síncrono e assíncrono em fluxos críticos de IO. |
| AP06 | Datetime naive | Utilizar objetos datetime sem informação de timezone. |
| AP07 | Primitivos em vez de Value Objects | Usar tipos básicos (float, str, int) para conceitos complexos do domínio. |
| AP09 | Lógica de VO fora do Domínio | Implementar regras de cálculo monetário ou validação de intervalo fora do respectivo Value Object. |
| AP10 | Ignore-Driven Development | Basear a qualidade do código no uso excessivo de supressores de linter/tipagem. |
| AP11 | Agendamento sem transação | Realizar a mudança de status para `SCHEDULED` e a criação de slots de agenda em transações separadas ou fora de um contexto transacional. |
| AP12 | Overlap validado fora da transação | A verificação de sobreposição de horários deve ocorrer obrigatoriamente dentro da transação que persiste o agendamento. |
| AP13 | Uso de datetime naive | Utilizar objetos datetime sem informação de timezone. |
| AP14 | Regras temporais fora de Value Objects | Implementar regras de intervalo (start < end) ou lógica de sobreposição fora de Value Objects especializados. |
| AP20 | Side Effects Distribuídos Sem Evento | Realizar chamadas de rede ou alterações em outros módulos sem o registro formal de um evento de domínio. |
| AP21 | Processamento Financeiro Não Idempotente | Implementar operações de cobrança ou estorno que não validam chaves de idempotência, permitindo duplicidade em retries. |
| AP22 | Estados Operacionais Sem Sincronização Financeira | Permitir que uma Ordem de Serviço avance para estados de execução sem a confirmação de um evento de pagamento correspondente. |
| AP23 | Acoplamento Direto Entre Gateway e Domínio | Permitir que detalhes de implementação de um provedor de pagamento (ex: campos específicos da API da Stripe) vazem para as camadas de `domain/` ou `services/`. |
