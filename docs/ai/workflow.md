# Workflow de Desenvolvimento com IA

## Objetivo

Este documento define o fluxo padrão de trabalho que deve ser seguido pela IA ao implementar qualquer funcionalidade no backend.

Ele garante previsibilidade, consistência e aderência à arquitetura definida.

---

# Princípio Geral

Toda tarefa deve seguir um fluxo estruturado antes de gerar código.

A IA NÃO deve gerar código diretamente sem passar pelas etapas de análise.

---

# Fluxo Obrigatório de Trabalho

## Etapa 1 — Entendimento

A IA deve primeiro:

- interpretar a solicitação
- identificar o domínio afetado
- identificar entidades envolvidas
- identificar fluxos impactados
- identificar regras de negócio aplicáveis

---

## Etapa 2 — Verificação na documentação

A IA deve consultar:

- `/docs/decisoes (ADR)`
- `/docs/fluxos`
- `/docs/regras-de-negocio`
- `/docs/api`
- `/docs/banco`

---

### Resultado esperado desta etapa:

- confirmar se já existe regra definida
- identificar conflitos ou lacunas
- evitar invenção de comportamento

---

## Etapa 3 — Mapeamento técnico

A IA deve definir:

- quais camadas serão alteradas
- quais arquivos serão criados/modificados
- impacto em:

  - api
  - services
  - repositories
  - schemas
  - domain
  - models

---

## Etapa 4 — Validação de impacto

Antes de qualquer código, a IA deve validar:

- isso quebra algum fluxo existente?
- isso altera status de OS?
- isso impacta regras de pagamento?
- isso impacta regras de agendamento?
- isso impacta segurança/autorização?

Se SIM:
→ justificar claramente antes de prosseguir

---

## Etapa 5 — Proposta de solução

A IA deve apresentar:

- abordagem técnica
- mudanças arquiteturais (se houver)
- entidades envolvidas
- endpoints afetados
- fluxos impactados

Sem código ainda.

---

## Etapa 6 — Implementação

Somente após validação lógica, a IA pode:

- gerar código
- respeitar arquitetura obrigatória
- respeitar separação de camadas

---

# Integração com Estado do Projeto

## Etapa adicional obrigatória

Após a implementação (Etapa 6), a IA deve executar:

---

## Etapa 7 — Atualização de estado

A IA deve:

### 1. Marcar tarefa como concluída

No `/docs/estado/progresso.md`

---

### 2. Atualizar módulos afetados

Exemplo:

- Auth → DONE
- Users → IN_PROGRESS
- Orders → BLOCKED

---

### 3. Liberar dependências

Se um módulo foi concluído, desbloquear dependentes.

---

### 4. Atualizar bloqueios

Remover bloqueios resolvidos automaticamente.

---

## Regra crítica

Se a etapa 7 não for executada:

→ a feature é considerada incompleta, mesmo que o código exista

# Regra de Ouro

## Nunca implementar direto

```text
SEM análise prévia = implementação inválida
```

---

# Estrutura de resposta obrigatória

Quando for gerar código, a IA deve seguir:

## 1. Resumo da mudança

O que será feito.

---

## 2. Impacto no sistema

O que muda no domínio.

---

## 3. Arquivos afetados

Lista clara.

---

## 4. Código

Implementação.

---

## 5. Observações

Riscos, decisões e dependências.

---

# Padrão para novas features

Toda nova funcionalidade deve seguir:

---

## Fase 1 — Modelagem

- entidades envolvidas
- regras
- fluxos

---

## Fase 2 — Backend core

- domain
- services
- repositories

---

## Fase 3 — API

- endpoints
- schemas
- validações

---

## Fase 4 — Integrações

- pagamentos
- notificações
- geolocalização

---

# Regras de Consistência

---

## Regra 01 — Não pular camadas

Fluxo obrigatório:

```text
api → service → repository → database
```

---

## Regra 02 — Services são obrigatórios

Nenhuma regra pode ser implementada fora de services.

---

## Regra 03 — Repositories são passivos

Repositories apenas executam queries.

---

## Regra 04 — API não contém lógica

Controllers apenas delegam chamadas.

---

## Regra 05 — Tudo deve ser tipado

Sem exceção.

---

## Regra 06 — Toda mudança deve respeitar ADRs

Se conflitar:
→ ADR prevalece

---

# Regras de Segurança no Workflow

---

## Regra 01 — Nunca expor dados sensíveis

Ex:

- senha_hash
- tokens
- chaves internas

---

## Regra 02 — Validar permissões sempre

Antes de qualquer ação:

- verificar ownership
- verificar role
- verificar status

---

## Regra 03 — Estado do sistema é crítico

Qualquer mudança de status de:

- OS
- pagamento
- prestador

→ deve ser tratada com cuidado extremo

---

# Regras de Qualidade

---

## Regra 01 — Simplicidade é prioridade

Evitar:

- abstrações desnecessárias
- overengineering
- padrões complexos prematuros

---

## Regra 02 — Código deve ser previsível

Outro desenvolvedor deve entender sem explicação externa.

---

## Regra 03 — Evitar duplicação de regra

Toda regra deve existir em um único lugar.

---

# Regras específicas para IA

---

## Regra 01 — Sempre pensar em impacto sistêmico

Nenhuma mudança é isolada.

---

## Regra 02 — Nunca assumir comportamento não documentado

Se não está em `/docs`, deve ser questionado.

---

## Regra 03 — Priorizar coerência do domínio

Mais importante que performance inicial.

---

## Regra 04 — Respeitar decisões anteriores

Nenhuma decisão nova pode invalidar ADR sem justificativa formal.

---

# Fluxo mental obrigatório da IA

Antes de qualquer resposta:

```text
Entender → Consultar docs → Mapear impacto → Validar → Propor → Implementar
```

---

# Resultado esperado

Seguindo este workflow:

- menos bugs estruturais
- menos retrabalho
- código consistente
- domínio preservado
- evolução controlada do sistema
