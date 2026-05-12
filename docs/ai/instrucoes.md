# Instruções para IA — Backend

## Objetivo

Este documento define como qualquer agente de IA deve atuar dentro deste projeto.

Ele é considerado parte da arquitetura do sistema.

Toda geração de código deve obedecer rigorosamente estas instruções.

---

# Princípio Fundamental

## Fonte única de verdade

A IA deve sempre considerar:

```text id="v9x2aa"
/docs como fonte oficial do domínio
```

Incluindo:

- regras de negócio
- fluxos
- DER
- endpoints
- convenções
- ADRs

---

# Qualidade obrigatória

Todo código gerado em /backend deve:

- passar em Ruff
- passar em BasedPyright strict
- evitar APIs deprecated
- possuir tipagem explícita
- evitar Any desnecessário
- respeitar Python 3.12

---

# Regra de Estado do Projeto (OBRIGATÓRIA)

A IA deve SEMPRE consultar e atualizar o arquivo:

/docs/estado/progresso.md

antes e depois de qualquer implementação.

---

## Antes de iniciar qualquer tarefa

A IA deve:

1. Ler o progresso atual
2. Identificar se a feature já existe
3. Verificar dependências
4. Validar se há bloqueios

Se estiver bloqueado:
→ não implementar

---

## Durante a execução

A IA deve seguir o workflow normalmente.

---

## Após concluir qualquer tarefa

A IA deve atualizar o arquivo:

/docs/estado/progresso.md

com:

- status atualizado
- dependências resolvidas
- novos módulos desbloqueados
- bloqueios removidos

---

## Regra de consistência

Se o código foi gerado, mas o progresso não foi atualizado:

→ a tarefa é considerada INCOMPLETA

---

# Regra 01 — Não inventar comportamento

A IA NÃO pode:

- inventar regras não documentadas
- criar fluxos fora do domínio definido
- assumir decisões arquiteturais não registradas

Se algo não estiver claro:

```text id="k3m9xq"
deve ser explicitamente questionado
```

---

# Regra 02 — Respeitar arquitetura obrigatória

A IA deve respeitar estritamente:

## api/

- apenas HTTP
- sem regra de negócio
- sem acesso direto ao banco

---

## services/

- contém TODA regra de negócio
- orquestra fluxo
- valida domínio

---

## repositories/

- acesso ao banco apenas
- sem regra de negócio
- sem lógica operacional

---

## schemas/

- DTOs
- validação de entrada/saída

---

## domain/

- entidades e regras centrais
- enums e contratos

---

# Regra 03 — Proibição de acoplamento

É proibido:

- api acessar models diretamente
- services acessar SQLAlchemy session diretamente
- repositories conter lógica de negócio
- schemas conter regra operacional

---

# Regra 04 — Prioridade de documentação

Ordem obrigatória de decisão:

1. `/docs/decisoes (ADR)`
2. `/docs/dominio`
3. `/docs/banco`
4. `/docs/api`
5. código existente

Se houver conflito:
→ ADR sempre vence

---

# Regra 05 — Consistência de domínio

A IA deve manter consistência com:

- nomes de entidades
- fluxos operacionais
- status definidos
- regras de negócio

Não pode criar variações paralelas.

---

# Regra 06 — Tipagem obrigatória

Todo código gerado deve possuir:

- type hints completos
- retorno explícito
- validação de entrada

---

# Regra 07 — Async obrigatório

Toda operação I/O deve ser:

```text id="8v1p0z"
async/await
```

Incluindo:

- banco
- serviços externos
- filas futuras

---

# Regra 08 — Services são o núcleo do sistema

Toda regra de negócio deve estar em services.

Exemplos:

- criação de OS
- validação de candidatura
- seleção de prestador
- cancelamento
- finalização
- pagamento
- avaliação

---

# Regra 09 — Fluxo obrigatório da OS

A IA deve respeitar o fluxo:

```text id="q2k8ld"
CRIADA
→ CANDIDATURAS
→ SELEÇÃO
→ AGENDADA
→ EM_EXECUÇÃO
→ FINALIZADA
→ PAGAMENTO
→ AVALIAÇÃO
```

---

# Regra 10 — Prestador tem restrições operacionais

A IA deve sempre considerar:

- apenas 1 OS ativa por vez
- sem sobreposição de agenda
- bloqueio pré-agendamento (1h)
- suspensão remove do fluxo

---

# Regra 11 — Pagamento é mockado no MVP

No MVP:

- não integrar gateway real
- simular respostas
- manter abstração de PaymentService

---

# Regra 12 — Candidatura é o mecanismo principal

O sistema NÃO funciona por atribuição direta inicial.

Fluxo correto:

- prestadores se candidatam
- tomador escolhe

Nunca inverter esse modelo.

---

# Regra 13 — Avaliação depende de OS finalizada

Avaliações só podem ocorrer:

```text id="e8m1c3"
após OS FINALIZADA
```

E devem respeitar:

- direção da avaliação
- unicidade
- nota obrigatória

---

# Regra 14 — Status são controlados

A IA não pode criar novos status sem ADR.

Todos status devem:

- estar documentados
- ser consistentes no sistema
- respeitar máquina de estados

---

# Regra 15 — Segurança

A IA deve garantir:

- JWT obrigatório
- validação de ownership
- proteção de endpoints sensíveis
- nunca expor dados sensíveis

---

# Regra 16 — Repositories são passivos

Repositories:

- não decidem nada
- não validam regras
- apenas executam queries

---

# Regra 17 — DTOs obrigatórios

Toda entrada e saída da API deve usar schemas.

Nunca retornar ORM diretamente.

---

# Regra 18 — Código deve ser previsível

A IA deve priorizar:

- legibilidade
- consistência
- simplicidade

Evitar:

- abstrações desnecessárias
- padrões complexos prematuros

---

# Regra 19 — Mudanças estruturais exigem ADR

Qualquer decisão sobre:

- arquitetura
- fluxo
- banco
- modelo de dados
- regras críticas

→ deve gerar ADR

---

# Regra 20 — Evolução incremental

A IA deve sempre:

- implementar mínimo necessário
- evitar overengineering
- respeitar MVP

---

# Regra 21 — Prioridade de implementação

Ordem preferencial:

1. domínio
2. services
3. repositories
4. schemas
5. api

Nunca inverter essa ordem.

---

# Regra 22 — Nunca pular camadas

Fluxo correto:

```text id="t0p3xq"
api → service → repository → database
```

---

# Regra 23 — Mudanças em fluxo exigem análise

Antes de alterar:

- OS flow
- candidaturas
- pagamentos
- agenda

→ a IA deve validar impacto no domínio

---

# Regra 24 — Consistência de nomes

A IA deve manter:

- nomes únicos
- sem duplicidade conceitual
- sem aliases conflitantes

---

# Regra 25 — Contexto sempre é o projeto

A IA nunca deve assumir:

- padrões externos não documentados
- frameworks adicionais
- dependências não aprovadas

---

# Regra Final

## Comportamento esperado da IA

A IA deve atuar como:

```text id="z1q8ld"
engenheiro de software sênior disciplinado pelo domínio
```

e não como gerador genérico de código.

---

# Resultado Esperado

Seguindo estas instruções:

- código consistente
- arquitetura estável
- baixa necessidade de refactor
- evolução previsível
- domínio preservado

