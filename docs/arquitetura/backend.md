# Arquitetura Backend

## Objetivo

O backend tem como objetivo fornecer uma API REST para intermediar a contratação e execução de serviços residenciais entre tomadores e prestadores de serviço.

O sistema deverá:

- permitir cadastro e autenticação de usuários
- permitir abertura de ordens de serviço
- permitir candidatura de prestadores
- permitir agendamento de execução
- controlar fluxo de execução da ordem
- registrar pagamentos
- registrar avaliações
- manter histórico de status e auditoria

---

# Stack Tecnológica

## Linguagem

- Python 3.12

## Framework Web

- FastAPI

## ORM

- SQLAlchemy 2.x

## Banco de Dados

- PostgreSQL

## Migrations

- Alembic

## Validação de Dados

- Pydantic v2

## Containers

- Docker
- Docker Compose

---

# Arquitetura do Projeto

O backend segue princípios inspirados em Clean Architecture.

Estrutura inicial:

```text
backend/
├── api/
├── domain/
├── repositories/
├── schemas/
├── services/
```

- **Ordens de Serviço (Service Orders):** Núcleo do sistema, gerencia o ciclo de vida da solicitação de serviço.
- **Candidaturas (Applications):** Gerencia o interesse e seleção de prestadores para uma OS.
- **Especialidades:** Taxonomia de serviços oferecidos na plataforma.

---

# Responsabilidades das Camadas

## api/

Responsável exclusivamente por:

- endpoints HTTP
- serialização/deserialização
- autenticação
- autorização
- controle de request/response

Não deve conter:

- acesso direto ao banco
- regras de negócio
- queries SQL

---

## services/

Responsável por:

- regras de negócio
- validações de domínio
- orquestração de fluxos
- aplicação de políticas do sistema

Exemplos:

- validar cancelamento
- validar agendamento
- validar disponibilidade do prestador
- processar fluxo de aceite

---

## repositories/

Responsável por:

- acesso ao banco
- queries
- persistência
- abstração do ORM

Não deve conter:

- regras de negócio
- validações de domínio

---

## schemas/

Responsável por:

- DTOs
- contratos de entrada
- contratos de saída
- validação de payloads

Utilizar Pydantic v2.

---

## domain/

Responsável por:

- entidades de domínio
- **Value Objects (VOs)**
- enums
- constantes
- contratos
- definições centrais do negócio

---

## Domain Value Objects

Os Value Objects são cidadãos de primeira classe do domínio.

- **Diferença de Entidades:** Ao contrário das Entidades, VOs não possuem ID. Se dois VOs têm os mesmos valores, eles são iguais.
- **Responsabilidade:** VOs encapsulam a lógica e validação de tipos complexos (Dinheiro, Datas, Coordenadas).
- **Integração:**
    - **Entities:** Devem usar VOs para seus atributos internos.
    - **Services:** Devem operar sobre VOs para garantir que regras como sobreposição de datas ou precisão monetária sejam respeitadas.
    - **Repositories:** Devem converter VOs para tipos primitivos do banco e vice-versa.

A centralização de regras temporais e monetárias em VOs evita que a lógica de "como calcular" ou "como validar" fique espalhada e inconsistente entre múltiplos Services.

---

# Regras Arquiteturais

## Regra 1

Nenhuma regra de negócio pode existir na camada `api/`.

---

## Regra 2

Toda operação de banco deve passar por repositories.

---

## Regra 3

Toda regra de domínio deve existir em services.

---

## Regra 4

Todas as operações devem utilizar tipagem explícita.

---

## Regra 5

Todo acesso ao banco será assíncrono.

---

## Regra 6

Todas as respostas da API devem ser serializadas por schemas.

---

# Estratégia de Desenvolvimento

O projeto será desenvolvido inicialmente como MVP.

Algumas integrações serão simuladas inicialmente:

## Gateway de Pagamento

No MVP:

- não haverá integração real
- pagamentos serão simulados
- dados mocados representarão respostas do gateway

O objetivo é permitir validação do fluxo de negócio antes da integração definitiva.

---

# Estratégia de Matching de Prestadores

Fluxo principal:

1. Tomador cria uma ordem de serviço
2. Prestadores elegíveis recebem a OS no feed
3. Prestadores se candidatam à execução
4. Tomador escolhe um único prestador
5. Prestador aprovado realiza contato/agendamento
6. Ordem segue para execução

---

# Estratégia de Disponibilidade do Prestador

Um prestador:

- só pode executar uma OS por vez
- não pode possuir conflito de agendamento
- não pode aceitar serviços em janela inferior a 1 hora antes de um agendamento futuro

---

# Estratégia de Auditoria

Mudanças importantes deverão ser registradas.

Inicialmente:

- histórico de status da OS
- pagamentos
- avaliações

---

# Estratégia de Escalabilidade

O projeto deverá ser preparado para:

- integração futura com gateway real
- geolocalização
- notificações
- filas assíncronas
- processamento distribuído
- websocket/push notifications

---

# Estratégia de Geolocalização

Prestadores deverão receber ordens priorizando proximidade geográfica.

A modelagem deverá permitir futura utilização de:

- latitude
- longitude
- busca geoespacial

---

# Convenções Gerais

## Banco

- snake_case
- nomes em inglês futuramente opcionais
- plural obrigatório para tabelas

---

## Python

- tipagem obrigatória
- async obrigatório
- imports absolutos
- evitar lógica procedural

---

## API

- prefixo `/api/v1`
- respostas JSON
- padronização de erros
- status HTTP semântico

---

# Situação Atual do Domínio

Fluxos ainda em definição:

- disputa
- reembolso
- suspensão administrativa
- moderação de avaliações

Esses fluxos deverão ser refinados posteriormente.
