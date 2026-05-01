# ADR-001 — Arquitetura Backend e Organização do Projeto

## Status

ACEITO

---

# Contexto

O sistema será uma plataforma de intermediação de serviços residenciais, contendo:

- autenticação de usuários
- ordens de serviço
- fluxo operacional
- pagamentos
- avaliações
- notificações
- geolocalização futura

O backend precisará:

- evoluir incrementalmente
- suportar regras de negócio complexas
- permitir crescimento modular
- manter boa testabilidade
- facilitar desenvolvimento assistido por IA

---

# Problema

Sem uma arquitetura bem definida, o sistema tende a sofrer rapidamente com:

- acoplamento excessivo
- lógica espalhada
- dificuldade de manutenção
- baixa previsibilidade
- duplicação de regras
- degradação de qualidade

Além disso, o uso intensivo de IA exige:

- contexto consistente
- separação clara de responsabilidades
- convenções previsíveis
- domínio explícito

---

# Decisão

O backend adotará uma arquitetura inspirada em Clean Architecture, organizada por responsabilidades.

Estrutura inicial:

```text
backend/
├── api/
├── services/
├── repositories/
├── schemas/
├── domain/
├── models/
├── core/
├── tests/
└── migrations/
```

---

# Responsabilidades

## api/

Responsável por:

- endpoints HTTP
- autenticação
- autorização
- serialização
- responses

Não deve conter:

- regra de negócio
- queries SQL
- lógica operacional

---

## services/

Responsável por:

- regras de negócio
- orquestração
- validações operacionais
- políticas do domínio

---

## repositories/

Responsável por:

- acesso ao banco
- persistência
- queries

---

## schemas/

Responsável por:

- DTOs
- requests
- responses
- validação

---

## domain/

Responsável por:

- enums
- contratos
- tipos
- definições centrais

---

## models/

Responsável por:

- models SQLAlchemy

---

## core/

Responsável por:

- configuração
- segurança
- exceptions
- logging
- infraestrutura compartilhada

---

# Decisões Técnicas

## Linguagem

Python 3.12.

---

## Framework Web

FastAPI.

---

## ORM

SQLAlchemy 2.x com AsyncSession.

---

## Banco de Dados

PostgreSQL.

---

## Migrations

Alembic.

---

## Containers

Docker + Docker Compose.

---

# Estratégia Assíncrona

Todas operações I/O deverão ser assíncronas.

Incluindo:

- banco
- integrações externas
- notificações futuras

---

# Estratégia de Banco

A aplicação utilizará PostgreSQL desde o MVP.

Motivos:

- concorrência
- integridade
- escalabilidade
- suporte geoespacial futuro
- robustez transacional

SQLite foi descartado por limitações operacionais.

---

# Estratégia de Domínio

O domínio será explicitamente modelado.

Regras importantes deverão existir:

- centralizadas
- documentadas
- testáveis

---

# Estratégia de Services

Services serão responsáveis por:

- validações
- fluxo operacional
- regras de negócio

Services não deverão acessar banco diretamente.

---

# Estratégia de Repositories

Repositories serão responsáveis exclusivamente por persistência.

Repositories não devem:

- conhecer HTTP
- lançar HTTPException
- conter lógica operacional

---

# Estratégia de API

A API seguirá:

- REST
- versionamento `/api/v1`
- responses padronizados
- JWT authentication

---

# Estratégia de Pagamentos

No MVP:

- pagamentos serão mockados
- gateway real não será integrado
- fluxo será abstraído

Objetivo:

- validar regras do domínio
- desacoplar integração externa

---

# Estratégia de Matching

Fluxo operacional:

1. Tomador cria OS
2. Prestadores elegíveis visualizam
3. Prestadores candidatam-se
4. Tomador seleciona um único prestador
5. Prestador agenda execução

---

# Estratégia de Disponibilidade

Prestador:

- não pode executar múltiplas OS simultaneamente
- não pode possuir conflito operacional
- possui bloqueio operacional próximo ao agendamento

---

# Estratégia de Auditoria

Eventos críticos deverão possuir rastreabilidade.

Inicialmente:

- mudanças de status
- pagamentos
- avaliações
- cancelamentos

---

# Estratégia de Escalabilidade

A arquitetura deverá permitir:

- filas assíncronas
- websocket
- push notifications
- geolocalização
- observabilidade
- antifraude
- cache distribuído

---

# Consequências Positivas

## Benefícios

- maior previsibilidade
- domínio explícito
- melhor integração com IA
- alta testabilidade
- menor acoplamento
- manutenção facilitada

---

# Consequências Negativas

## Custos

- maior quantidade inicial de arquivos
- curva de aprendizado
- necessidade de disciplina arquitetural

---

# Alternativas Consideradas

---

## Arquitetura MVC tradicional

Descartada por:

- tendência a controllers gordos
- acoplamento rápido
- mistura de responsabilidades

---

## Monolito procedural simples

Descartado por:

- baixa escalabilidade
- difícil manutenção
- degradação rápida do domínio

---

## Microserviços

Descartado para MVP por:

- complexidade excessiva
- overhead operacional
- custo prematuro

---

# Regras Arquiteturais Obrigatórias

---

## RA01

Nenhuma regra de negócio na camada `api/`.

---

## RA02

Todo acesso ao banco via repositories.

---

## RA03

Toda regra operacional em services.

---

## RA04

Tipagem obrigatória.

---

## RA05

Operações assíncronas obrigatórias.

---

## RA06

Responses devem utilizar schemas.

---

# Integração com IA

A arquitetura foi organizada para facilitar:

- contexto previsível
- geração de código
- manutenção assistida por IA
- rastreabilidade de regras

A documentação em `/docs` é considerada fonte oficial de verdade do domínio.

---

# Próximos ADRs Planejados

- ADR-002 — Estratégia de autenticação JWT
- ADR-003 — Estratégia de pagamentos mockados
- ADR-004 — Estratégia de auditoria
- ADR-005 — Estratégia de geolocalização
- ADR-006 — Estratégia de notificações
- ADR-007 — Estratégia de suspensão automática
