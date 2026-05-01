# DER — Modelo de Dados

## Objetivo

Este documento descreve a modelagem inicial do banco de dados do sistema de intermediação de serviços residenciais.

O objetivo do modelo é:

- representar os atores do sistema
- representar o fluxo operacional das ordens de serviço
- permitir auditoria e rastreabilidade
- permitir expansão futura do domínio
- suportar geolocalização e escalabilidade futura

---

# Convenções

## Convenções de nomenclatura

- tabelas em `snake_case`
- nomes no plural
- chaves primárias `id`
- timestamps em UTC
- foreign keys explícitas

---

# Estratégia de Modelagem

## Usuários

O sistema utiliza uma entidade central `usuarios`.

Um mesmo usuário poderá:

- ser tomador
- ser prestador
- ser administrador

As responsabilidades específicas ficam desacopladas em tabelas separadas.

---

# Entidades

---

# usuarios

Representa usuários autenticados da plataforma.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| nome | VARCHAR(255) | obrigatório |
| email | VARCHAR(255) | único |
| senha_hash | TEXT | obrigatório |
| telefone | VARCHAR(20) | obrigatório |
| tipo | VARCHAR(50) | legado / opcional |
| ativo | BOOLEAN | default true |
| email_verificado | BOOLEAN | default false |
| telefone_verificado | BOOLEAN | default false |
| ultimo_login | TIMESTAMP | nullable |
| data_cadastro | TIMESTAMP | obrigatório |

---

## Regras

- email deve ser único
- senha nunca deve ser armazenada em texto puro
- usuários inativos não podem autenticar

---

# tomadores

Representa usuários que solicitam serviços.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| usuario_id | UUID | FK usuarios(id) |
| endereco_id | UUID | FK enderecos(id) |

---

## Relacionamentos

- um tomador pertence a um usuário
- um tomador pode abrir várias ordens de serviço

---

# prestadores

Representa usuários prestadores de serviço.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| usuario_id | UUID | FK usuarios(id) |
| descricao | TEXT | nullable |
| media_avaliacao | NUMERIC(3,2) | default 0 |
| suspenso | BOOLEAN | default false |
| data_suspensao | TIMESTAMP | nullable |

---

## Regras

- prestador deve possuir ao menos uma especialidade
- prestadores suspensos não podem aceitar ordens
- prestador só pode executar uma OS por vez

---

# administradores

Representa administradores da plataforma.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| usuario_id | UUID | FK usuarios(id) |
| nivel_acesso | INTEGER | obrigatório |

---

# especialidades

Especialidades disponíveis para prestação de serviço.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| nome | VARCHAR(255) | único |
| descricao | TEXT | nullable |

---

# prestadores_especialidades

Relacionamento N:N entre prestadores e especialidades.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| prestador_id | UUID | PK/FK prestadores(id) |
| especialidade_id | UUID | PK/FK especialidades(id) |
| data_vinculo | TIMESTAMP | obrigatório |

---

# enderecos

Representa endereços do sistema.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| cep | VARCHAR(20) | obrigatório |
| logradouro | VARCHAR(255) | obrigatório |
| numero | VARCHAR(20) | obrigatório |
| complemento | VARCHAR(255) | nullable |
| bairro | VARCHAR(255) | obrigatório |
| cidade | VARCHAR(255) | obrigatório |
| estado | VARCHAR(2) | obrigatório |
| latitude | NUMERIC(10,7) | nullable |
| longitude | NUMERIC(10,7) | nullable |
| referencia | TEXT | nullable |

---

## Objetivo

Preparar o sistema para:

- geolocalização
- cálculo de distância
- matching por proximidade

---

# ordens_servico

Representa solicitações de serviço abertas pelos tomadores.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| codigo | VARCHAR(50) | único |
| tomador_id | UUID | FK tomadores(id) |
| prestador_id | UUID | FK prestadores(id), nullable |
| especialidade_id | UUID | FK especialidades(id) |
| endereco_id | UUID | FK enderecos(id) |
| titulo | VARCHAR(255) | obrigatório |
| descricao | TEXT | obrigatório |
| status_atual | VARCHAR(50) | obrigatório |
| valor_estimado | NUMERIC(10,2) | nullable |
| data_criacao | TIMESTAMP | obrigatório |
| data_agendamento | TIMESTAMP | nullable |
| data_finalizacao | TIMESTAMP | nullable |
| data_cancelamento | TIMESTAMP | nullable |
| motivo_cancelamento | TEXT | nullable |
| observacoes_cancelamento | TEXT | nullable |
| confirmacao_tomador | BOOLEAN | default false |

---

# Fluxo Operacional

## Fluxo esperado

1. Tomador cria OS
2. Prestadores elegíveis visualizam OS
3. Prestadores se candidatam
4. Tomador escolhe um prestador
5. Prestador realiza agendamento
6. Prestador executa serviço
7. Tomador confirma finalização
8. Pagamento é liberado
9. Avaliação é registrada

---

# Status possíveis

## Status iniciais

- CRIADA
- AGUARDANDO_CANDIDATOS
- AGUARDANDO_ESCOLHA_TOMADOR

## Status operacionais

- PRESTADOR_SELECIONADO
- AGENDADA
- EM_EXECUCAO

## Status finais

- FINALIZADA
- CANCELADA
- EXPIRADA

---

# Regras

- OS pode nascer sem prestador
- prestador selecionado deve possuir especialidade compatível
- não pode existir conflito de agendamento
- ordens canceladas não podem retornar ao fluxo

---

# status_ordens_servico

Histórico de transição de status das ordens.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| ordem_servico_id | UUID | FK ordens_servico(id) |
| status_anterior | VARCHAR(50) | nullable |
| status_novo | VARCHAR(50) | obrigatório |
| data_mudanca | TIMESTAMP | obrigatório |
| observacao | TEXT | nullable |

---

## Objetivo

Auditoria completa do fluxo operacional.

---

# candidaturas_ordens_servico

Representa candidaturas de prestadores para execução da OS.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| ordem_servico_id | UUID | FK ordens_servico(id) |
| prestador_id | UUID | FK prestadores(id) |
| mensagem | TEXT | nullable |
| status | VARCHAR(50) | obrigatório |
| data_candidatura | TIMESTAMP | obrigatório |

---

## Status possíveis

- PENDENTE
- ACEITA
- RECUSADA
- CANCELADA

---

## Regras

- prestador não pode se candidatar duas vezes
- tomador só pode aceitar uma candidatura
- candidaturas recusadas deixam de aparecer ao prestador

---

# disponibilidades_prestadores

Representa agenda operacional do prestador.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| prestador_id | UUID | FK prestadores(id) |
| ordem_servico_id | UUID | FK ordens_servico(id) |
| inicio_agendamento | TIMESTAMP | obrigatório |
| fim_agendamento | TIMESTAMP | obrigatório |
| status | VARCHAR(50) | obrigatório |

---

## Regras

- não pode existir sobreposição de horário
- prestador deve possuir janela mínima de 1 hora antes da execução
- prestador não pode executar múltiplas OS simultaneamente

---

# pagamentos

Representa pagamentos relacionados às ordens de serviço.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| ordem_servico_id | UUID | FK ordens_servico(id) |
| valor | NUMERIC(10,2) | obrigatório |
| forma_pagamento | VARCHAR(50) | obrigatório |
| status_pagamento | VARCHAR(50) | obrigatório |
| gateway | VARCHAR(100) | nullable |
| gateway_transaction_id | VARCHAR(255) | nullable |
| codigo_transacao | VARCHAR(255) | nullable |
| data_transacao | TIMESTAMP | nullable |
| data_confirmacao | TIMESTAMP | nullable |

---

## Estratégia MVP

No MVP:

- pagamentos serão simulados
- gateway externo não será integrado
- respostas mocadas representarão aprovação/reprovação

---

## Status possíveis

- PENDENTE
- PROCESSANDO
- APROVADO
- RECUSADO
- ESTORNADO

---

# avaliacoes

Representa avaliações entre usuários.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| ordem_servico_id | UUID | FK ordens_servico(id) |
| avaliador_id | UUID | FK usuarios(id) |
| avaliado_id | UUID | FK usuarios(id) |
| tipo_avaliacao | VARCHAR(50) | obrigatório |
| nota | INTEGER | obrigatório |
| comentario | TEXT | nullable |
| data_avaliacao | TIMESTAMP | obrigatório |

---

## Tipos possíveis

- TOMADOR_PARA_PRESTADOR
- PRESTADOR_PARA_TOMADOR

---

## Regras

- nota deve variar entre 1 e 5
- comentário é opcional
- avaliação só pode ocorrer após OS finalizada
- usuários só podem avaliar participantes da OS
- não pode existir autoavaliação
- deve existir no máximo uma avaliação por direção

---

# notificacoes

Representa notificações do sistema.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| usuario_id | UUID | FK usuarios(id) |
| tipo | VARCHAR(50) | obrigatório |
| titulo | VARCHAR(255) | obrigatório |
| mensagem | TEXT | obrigatório |
| lida | BOOLEAN | default false |
| data_envio | TIMESTAMP | obrigatório |

---

# Fluxos futuros

Fluxos ainda não modelados completamente:

- disputa
- reembolso
- moderação de avaliação
- bloqueio administrativo
- webhook de pagamentos
- fila de notificações
- chat interno

---

# Estratégia de Expansão

O modelo foi preparado para futura integração com:

- websocket
- push notifications
- geolocalização avançada
- gateways reais
- fila assíncrona
- busca geoespacial
- observabilidade
- antifraude
