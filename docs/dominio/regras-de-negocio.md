# Regras de Negócio

## Objetivo

Este documento descreve as regras de negócio do sistema de intermediação de serviços residenciais.

As regras aqui definidas devem ser consideradas fonte oficial de comportamento do domínio.

Toda implementação backend deverá respeitar integralmente estas regras.

---

# Convenções

## Terminologia

### OS

Abreviação de "Ordem de Serviço".

---

### Tomador

Usuário responsável por solicitar serviços.

---

### Prestador

Usuário responsável por executar serviços.

---

# Regras Gerais do Sistema

---

# RN01 — Validação de Prestador

Um prestador somente poderá atender ordens de serviço se possuir ao menos uma especialidade vinculada ao seu cadastro.

---

## Implicações

- prestadores sem especialidade não aparecem no feed
- prestadores sem especialidade não podem se candidatar
- especialidades devem estar ativas

---

# RN02 — Política de Cancelamento

O cancelamento de uma ordem de serviço pelo tomador somente poderá ocorrer sem cobrança de taxa se houver antecedência mínima de 2 horas em relação ao horário agendado.

---

## Implicações

- cancelamentos tardios poderão gerar taxa
- política financeira poderá ser ajustada futuramente
- o cálculo deve considerar timezone UTC

---

# RN03 — Liberação de Pagamento

O pagamento ao prestador somente poderá ser liberado após confirmação da finalização do serviço pelo tomador.

---

## Fluxo esperado

1. Prestador marca OS como finalizada
2. Sistema aguarda confirmação do tomador
3. Pagamento é processado
4. Sistema altera status do pagamento

---

## Regras complementares

- pagamentos não devem ocorrer automaticamente antes da confirmação
- pagamento deve possuir rastreabilidade
- integração real será implementada futuramente

---

# RN04 — Suspensão por Desempenho

Prestadores que acumularem média inferior a 3 estrelas nas últimas 10 avaliações poderão ser suspensos automaticamente.

---

## Consequências

Prestadores suspensos:

- não aparecem em buscas
- não recebem novas OS
- não podem se candidatar

---

## Observações

- suspensão poderá ser automática ou administrativa
- regras futuras poderão considerar reincidência

---

# RN05 — Critério de Avaliação

Usuários somente poderão avaliar uns aos outros se existir uma OS finalizada entre ambos.

---

## Regras complementares

- avaliações devem estar vinculadas à OS
- avaliações devem respeitar direção da avaliação
- autoavaliação é proibida

---

# Regras Implícitas Formalizadas

---

# RI01 — Email Único

O email do usuário deve ser único no sistema.

---

## Regras complementares

- emails devem ser normalizados
- emails são case insensitive
- duplicidade não é permitida

---

# RI02 — Especialidade Obrigatória

Prestadores sem especialidade não podem participar do fluxo operacional.

---

# RI03 — Pagamento condicionado à finalização

Nenhum pagamento poderá ser aprovado antes da confirmação do tomador.

---

# RI04 — Imutabilidade de Ordem Cancelada

Ordens canceladas não podem retornar ao fluxo operacional.

---

## Implicações

Após cancelamento:

- não pode haver reagendamento
- não pode haver nova candidatura
- não pode haver mudança de status operacional

---

# RI05 — Restrição de Cancelamento

Somente participantes da OS podem solicitar cancelamento.

---

## Participantes válidos

- tomador
- prestador selecionado
- administrador

---

# RI06 — Avaliação Única

Uma mesma direção de avaliação somente poderá ocorrer uma vez por OS.

---

## Exemplos válidos

- tomador → prestador
- prestador → tomador

---

## Exemplos inválidos

- tomador avaliar prestador duas vezes
- prestador avaliar tomador duas vezes

---

# RI07 — Restrição para Prestadores Suspensos

Prestadores suspensos não podem:

- receber novas OS
- se candidatar
- aparecer no feed
- aceitar serviços

---

# Regras de Usuário

---

# RU01 — Multiplicidade de Papéis Restrita

Um mesmo usuário pode ser simultaneamente:
- **Client** (Tomador)
- **Provider** (Prestador)

**Restrição Crítica:**
- Um **Admin** NÃO pode possuir o papel de Client ou Provider.
- O papel de Admin é exclusivo e destinado apenas à gestão da plataforma.

---

# RU02 — Usuário inativo não pode autenticar

Usuários inativos (`is_active = False`) devem possuir acesso bloqueado.

---

# RU03 — Senha segura obrigatória

Toda senha deverá possuir:
- mínimo de 8 caracteres
- pelo menos 1 número
- pelo menos 1 letra

---

# RU04 — Regras de Admin

- Deve obrigatoriamente utilizar um e-mail do domínio oficial da aplicação (ex: `@maos-a-obra.com`).
- Não pode se candidatar a Ordens de Serviço.
- Não pode criar Ordens de Serviço operacionais.

---

# Regras de Ordem de Serviço

---

# ROS01 — Criação da OS

Toda OS deve possuir:
- **Client** (tomador) válido
- **Specialty** (especialidade) válida
- título
- descrição
- endereço de execução (`address_id`)
- data desejada (`preferred_date`)

---

# ROS02 — Prestador inicialmente opcional

Uma OS nasce sem prestador associado (`provider_id = NULL`).

---

# ROS03 — Prestador deve possuir especialidade compatível

Prestador só pode se candidatar a OS compatível com suas especialidades.

---

# ROS04 — Fluxo obrigatório da OS

Fluxo principal:
1. criação (com `preferred_date`)
2. candidaturas
3. seleção
4. agendamento (define `scheduled_at`)
5. execução
6. finalização
7. pagamento
8. avaliação

---

# ROS05 — Status válidos

## Status iniciais
- CREATED
- AWAITING_CANDIDATES
- AWAITING_SELECTION

## Status operacionais
- PROVIDER_SELECTED
- SCHEDULED
- IN_PROGRESS

## Status finais
- FINISHED
- CANCELLED
- EXPIRED

---

# ROS06 — Transições inválidas

Exemplos inválidos:

- CANCELADA → EM_EXECUCAO
- FINALIZADA → AGENDADA
- EXPIRADA → ACEITA

---

# ROS07 — Valor estimado

Valor estimado deve ser maior que zero.

---

# ROS08 — Agendamento futuro

Data de agendamento deve ser futura.

---

# Regras de Candidatura

---

# RC01 — Feed de Prestadores

Prestadores elegíveis receberão OS em seu feed.

---

## Critérios futuros

- geolocalização
- especialidade
- disponibilidade
- reputação

---

# RC02 — Candidatura única

Prestador não pode se candidatar mais de uma vez para mesma OS.

---

# RC03 — Seleção única

Tomador somente poderá aprovar um prestador por OS.

---

# RC04 — Recusa remove OS do feed

Prestadores recusados deixam de visualizar a OS.

---

# RC05 — Prestador suspenso não pode candidatar-se

Prestadores suspensos ficam bloqueados do fluxo.

---

# RC06 — Auto-candidatura proibida

O cliente proprietário da OS não pode se candidatar a ela, mesmo que possua perfil de prestador.

---

# RC07 — Atomicidade de Seleção

O aceite de uma candidatura deve automaticamente rejeitar todas as outras candidaturas pendentes daquela OS em uma única transação.

---

# RC08 — Especialidade Obrigatória para Candidatura

O prestador só pode se candidatar a uma OS se possuir a especialidade vinculada à OS em seu cadastro ativo.

---

# Regras de Agendamento

---

## RS01 — Não pode haver overlap

Um prestador não pode possuir conflitos de horário em sua agenda operacional. Isso inclui:
- Duas Ordens de Serviço agendadas para o mesmo período.
- Bloqueios manuais que conflitem com agendamentos.
- Qualquer intervalo temporal que se sobreponha a outro já existente.

A validação de sobreposição deve utilizar obrigatoriamente o método `DateRange.overlaps()`.

---

## RS02 — Agendamento exige Provider selecionado

Uma Ordem de Serviço somente poderá transicionar para o status `SCHEDULED` se:
- Existir um prestador aceito (`provider_id` não nulo).
- Existir uma candidatura com status `ACCEPTED`.
- O status atual da OS for `PROVIDER_SELECTED`.

---

## RS03 — Estados terminais bloqueiam agendamento

Ordens de Serviço nos estados `CANCELLED`, `FINISHED` ou `EXPIRED` não podem:
- Ser agendadas ou reagendadas.
- Gerar ou manter Busy Slots na agenda do prestador.
- Sofrer qualquer alteração relacionada à agenda operacional.

---

## RS04 — Agendamento deve ser transacional

A criação de um agendamento deve ser uma operação atômica e transacional, garantindo que:
- O Busy Slot seja criado na agenda do prestador.
- O status da OS seja alterado para `SCHEDULED`.
- Os horários oficiais sejam registrados na OS.
Se qualquer uma dessas etapas falhar, toda a operação deve ser revertida.

---

## RS05 — UTC obrigatório

Todo e qualquer registro temporal de agendamento:
- Deve ser armazenado e processado em UTC.
- Deve utilizar objetos `datetime` *timezone-aware*.
- É terminantemente proibido o uso de `datetime` *naive*.

---

## RS06 — Agendamento passado proibido

O sistema não deve permitir a criação de agendamentos ou Busy Slots com data de início no passado em relação ao momento da transação.

---

## RS07 — Ownership operacional

Somente os seguintes atores possuem permissão para confirmar ou alterar um agendamento:
- O Cliente (tomador) proprietário da Ordem de Serviço.
- O Prestador selecionado para a execução do serviço.
- Administradores do sistema (para fins de suporte e moderação).

---

# RA03 — Janela de bloqueio operacional

Prestador não poderá aceitar novas execuções em janela inferior a 1 hora antes de agendamento futuro.

---

## Objetivo

Garantir deslocamento e preparação operacional.

---

# RA04 — Agendamento obrigatório para execução

Uma OS somente poderá entrar em execução após agendamento válido.

---

# Regras de Pagamento

---

# RP01 — Pagamento vinculado à OS

Todo pagamento deve estar vinculado a uma OS.

---

# RP02 — Status válidos

- PENDENTE
- PROCESSANDO
- APROVADO
- RECUSADO
- ESTORNADO

---

# RP03 — MVP utiliza pagamento mockado

No MVP:

- não haverá integração real
- respostas serão simuladas
- gateway será abstraído

---

# RP04 — Pagamento deve ser auditável

Todo pagamento deve possuir:

- timestamps
- identificadores
- histórico rastreável

---

# Regras de Avaliação

---

# RAV01 — Nota obrigatória

Toda avaliação deve possuir nota.

---

# RAV02 — Intervalo de nota

Notas válidas:

- mínimo 1
- máximo 5

---

# RAV03 — Comentário opcional

Comentário não é obrigatório.

---

# RAV04 — Participantes válidos

Somente participantes da OS podem avaliar.

---

# RAV05 — Autoavaliação proibida

Usuário não pode avaliar a si próprio.

---

# RAV06 — Ordem finalizada obrigatória

Avaliações somente podem ocorrer após conclusão da OS.

---

# RAV07 — Direção obrigatória

Toda avaliação deve informar direção:

- TOMADOR_PARA_PRESTADOR
- PRESTADOR_PARA_TOMADOR

---

# Regras de Auditoria

---

# RAD01 — Histórico obrigatório

Mudanças importantes devem gerar histórico.

---

## Eventos auditáveis

- mudança de status
- pagamentos
- suspensões
- avaliações
- cancelamentos

---

# Regras Futuras Ainda Não Definidas

Fluxos pendentes de refinamento:

- disputa
- reembolso
- mediação administrativa
- moderação de avaliações
- antifraude
- fila de prioridade
- ranking de prestadores
- SLA operacional

---

# Regras Técnicas Complementares

---

# RT01 — Operações assíncronas

Toda operação de banco deve utilizar SQLAlchemy async.

---

# RT02 — Timestamps em UTC

Todos timestamps devem ser armazenados em UTC.

---

# RT03 — Tipagem obrigatória

Todo código backend deve possuir tipagem explícita.

---

# RT04 — Repositories obrigatórios

Acesso ao banco deve ocorrer exclusivamente via repositories.

---

# RT05 — Services centralizam regras

Toda regra de negócio deve ser implementada em services.
