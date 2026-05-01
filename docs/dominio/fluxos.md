# Fluxos do Sistema

## Objetivo

Este documento descreve os fluxos operacionais principais do sistema.

Os fluxos aqui documentados representam o comportamento esperado do domínio e deverão ser respeitados pela implementação backend.

---

# Convenções

## Terminologia

### OS

Ordem de Serviço.

---

### Feed de Ordens

Lista de ordens disponíveis para candidatura por prestadores elegíveis.

---

### Prestador Elegível

Prestador que:

- possui especialidade compatível
- não está suspenso
- está disponível operacionalmente
- não possui conflito de agenda

---

# Fluxo 01 — Cadastro de Usuário

## Objetivo

Permitir cadastro de usuários no sistema.

---

## Atores

- usuário
- sistema

---

## Pré-condições

- email não cadastrado
- telefone válido

---

## Fluxo Principal

### Etapa 1

Usuário informa:

- nome
- email
- senha
- telefone

---

### Etapa 2

Sistema valida:

- unicidade do email
- formato do email
- força da senha

---

### Etapa 3

Sistema cria usuário.

---

### Etapa 4

Sistema registra data de cadastro.

---

### Etapa 5

Sistema retorna autenticação inicial.

---

## Pós-condições

- usuário autenticado
- usuário ativo
- perfil criado

---

# Fluxo 02 — Tornar-se Prestador

## Objetivo

Permitir que um usuário torne-se prestador de serviço.

---

## Atores

- usuário
- sistema

---

## Pré-condições

- usuário autenticado
- usuário ativo

---

## Fluxo Principal

### Etapa 1

Usuário acessa fluxo de cadastro de prestador.

---

### Etapa 2

Usuário informa:

- descrição profissional
- especialidades

---

### Etapa 3

Sistema valida:

- existência das especialidades
- duplicidade de vínculo

---

### Etapa 4

Sistema cria perfil de prestador.

---

## Pós-condições

- usuário passa a ser elegível para candidaturas
- prestador aparece no fluxo operacional

---

# Fluxo 03 — Criação de Ordem de Serviço

## Objetivo

Permitir abertura de uma nova OS.

---

## Atores

- tomador
- sistema

---

## Pré-condições

- tomador autenticado
- tomador ativo
- especialidade válida

---

## Fluxo Principal

### Etapa 1

Tomador informa:

- título
- descrição
- especialidade
- endereço
- data desejada
- valor estimado

---

### Etapa 2

Sistema valida:

- dados obrigatórios
- especialidade válida
- endereço válido

---

### Etapa 3

Sistema cria OS.

---

### Etapa 4

Sistema define status:

```text
CRIADA
```

---

### Etapa 5

Sistema disponibiliza OS para prestadores elegíveis.

---

## Pós-condições

- OS criada
- feed atualizado
- prestadores notificados futuramente

---

# Fluxo 04 — Feed de Ordens

## Objetivo

Disponibilizar ordens elegíveis para prestadores.

---

## Critérios de Elegibilidade

Prestador deve:

- possuir especialidade compatível
- não estar suspenso
- não possuir conflito operacional
- não possuir agendamento conflitante

---

## Critérios Futuros

- proximidade geográfica
- reputação
- SLA
- ranking

---

# Fluxo 05 — Candidatura à Ordem

## Objetivo

Permitir candidatura de prestadores.

---

## Atores

- prestador
- sistema

---

## Pré-condições

- prestador elegível
- OS disponível
- prestador não suspenso

---

## Fluxo Principal

### Etapa 1

Prestador seleciona OS no feed.

---

### Etapa 2

Prestador envia candidatura.

---

### Etapa 3

Sistema valida:

- candidatura duplicada
- conflito de agenda
- elegibilidade

---

### Etapa 4

Sistema registra candidatura.

---

### Etapa 5

Sistema altera status da candidatura:

```text
PENDENTE
```

---

### Etapa 6

Sistema notifica tomador.

---

## Pós-condições

- candidatura registrada
- OS permanece aberta para outras candidaturas

---

# Fluxo 06 — Escolha do Prestador

## Objetivo

Permitir seleção de um único prestador.

---

## Atores

- tomador
- sistema

---

## Pré-condições

- existência de candidaturas pendentes

---

## Fluxo Principal

### Etapa 1

Tomador visualiza candidatos.

---

### Etapa 2

Tomador escolhe prestador.

---

### Etapa 3

Sistema valida:

- disponibilidade operacional
- status do prestador
- candidatura válida

---

### Etapa 4

Sistema vincula prestador à OS.

---

### Etapa 5

Sistema altera status da candidatura escolhida:

```text
ACEITA
```

---

### Etapa 6

Sistema altera candidaturas restantes:

```text
RECUSADA
```

---

### Etapa 7

Sistema altera status da OS:

```text
PRESTADOR_SELECIONADO
```

---

## Pós-condições

- prestador definido
- demais candidatos removidos do fluxo

---

# Fluxo 07 — Agendamento

## Objetivo

Definir data operacional da execução.

---

## Atores

- tomador
- prestador
- sistema

---

## Pré-condições

- prestador selecionado

---

## Fluxo Principal

### Etapa 1

Prestador e tomador definem horário.

---

### Etapa 2

Prestador registra agendamento.

---

### Etapa 3

Sistema valida:

- conflitos de agenda
- janela operacional
- disponibilidade do prestador

---

### Etapa 4

Sistema cria disponibilidade operacional.

---

### Etapa 5

Sistema altera status da OS:

```text
AGENDADA
```

---

## Pós-condições

- agenda bloqueada
- prestador indisponível no horário

---

# Fluxo 08 — Execução da Ordem

## Objetivo

Representar início operacional do serviço.

---

## Pré-condições

- OS agendada
- horário válido

---

## Fluxo Principal

### Etapa 1

Prestador inicia execução.

---

### Etapa 2

Sistema altera status:

```text
EM_EXECUCAO
```

---

## Pós-condições

- OS operacionalmente ativa

---

# Fluxo 09 — Finalização da Ordem

## Objetivo

Registrar conclusão do serviço.

---

## Atores

- prestador
- sistema

---

## Pré-condições

- OS em execução

---

## Fluxo Principal

### Etapa 1

Prestador marca OS como concluída.

---

### Etapa 2

Sistema registra data de finalização.

---

### Etapa 3

Sistema aguarda confirmação do tomador.

---

## Pós-condições

- aguardando confirmação final

---

# Fluxo 10 — Confirmação do Tomador

## Objetivo

Confirmar execução correta do serviço.

---

## Atores

- tomador
- sistema

---

## Pré-condições

- OS concluída pelo prestador

---

## Fluxo Principal

### Etapa 1

Tomador confirma conclusão.

---

### Etapa 2

Sistema altera:

```text
confirmacao_tomador = true
```

---

### Etapa 3

Sistema altera status:

```text
FINALIZADA
```

---

### Etapa 4

Sistema inicia fluxo de pagamento.

---

## Pós-condições

- OS finalizada oficialmente
- pagamento liberado

---

# Fluxo 11 — Pagamento

## Objetivo

Processar pagamento da OS.

---

## Atores

- sistema
- gateway mockado

---

## Estratégia MVP

No MVP:

- gateway será simulado
- pagamentos serão mockados

---

## Fluxo Principal

### Etapa 1

Sistema cria pagamento pendente.

---

### Etapa 2

Sistema simula processamento.

---

### Etapa 3

Sistema altera status:

```text
APROVADO
```

ou

```text
RECUSADO
```

---

### Etapa 4

Sistema registra auditoria.

---

## Pós-condições

- pagamento finalizado
- histórico preservado

---

# Fluxo 12 — Avaliação

## Objetivo

Permitir avaliação entre participantes.

---

## Atores

- tomador
- prestador
- sistema

---

## Pré-condições

- OS finalizada
- usuário participante da OS

---

## Fluxo Principal

### Etapa 1

Usuário informa:

- nota
- comentário opcional

---

### Etapa 2

Sistema valida:

- nota entre 1 e 5
- direção da avaliação
- duplicidade
- autoavaliação

---

### Etapa 3

Sistema registra avaliação.

---

### Etapa 4

Sistema recalcula média do prestador.

---

## Pós-condições

- avaliação registrada
- reputação atualizada

---

# Fluxo 13 — Cancelamento da Ordem

## Objetivo

Permitir cancelamento da OS.

---

## Atores

- tomador
- prestador
- administrador

---

## Pré-condições

- OS não finalizada

---

## Fluxo Principal

### Etapa 1

Usuário solicita cancelamento.

---

### Etapa 2

Sistema valida:

- participante válido
- status cancelável
- política de antecedência

---

### Etapa 3

Sistema registra:

- motivo
- observações
- timestamp

---

### Etapa 4

Sistema altera status:

```text
CANCELADA
```

---

### Etapa 5

Sistema bloqueia fluxo operacional.

---

## Pós-condições

- OS encerrada permanentemente

---

# Fluxo 14 — Suspensão Automática

## Objetivo

Suspender prestadores com desempenho crítico.

---

## Critério Inicial

Média inferior a:

```text
3 estrelas
```

nas últimas:

```text
10 avaliações
```

---

## Consequências

Prestador:

- sai do feed
- não recebe OS
- não pode candidatar-se

---

# Fluxos Futuros Não Modelados

## Fluxos pendentes

- disputa
- reembolso
- mediação administrativa
- antifraude
- moderação de avaliações
- notificações push
- websocket
- chat interno

---

# Fluxos Técnicos Futuros

## Possíveis evoluções

- filas assíncronas
- processamento distribuído
- retry automático
- webhook de pagamentos
- notificações em tempo real
- ranking operacional
- SLA dinâmico
