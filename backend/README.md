# Backend - Mãos a Obra

API RESTful desenvolvida com **FastAPI** e **SQLAlchemy 2.0 (Async)** para gerenciar o sistema de intermediação de serviços residenciais.

## Tecnologias
- **Framework:** FastAPI
- **Banco de Dados:** PostgreSQL (via SQLAlchemy)
- **Migrações:** Alembic
- **Validação:** Pydantic
- **Testes:** Pytest (com pytest-asyncio)

## Funcionalidades Core
- **Autenticação:** JWT-based.
- **Gestão de Ordens:** Ciclo completo de vida (Status Machine).
- **Agendamento:** Gestão de slots com prevenção de conflitos.
- **Pagamentos:** Integração mockada com rastreabilidade de transações.
- **Avaliação 360:** Média de performance e suspensão automática.
- **Auditoria:** Histórico detalhado de transições de status (RAD01).

## Desenvolvimento

### Local
1. Crie o venv: `python -m venv .venv`
2. Ative-o: `source .venv/bin/activate`
3. Instale as dependências: `pip install -r requirements.txt -r requirements-dev.txt`
4. Configure o `.env` baseado no exemplo fornecido.

### Qualidade de Código
O projeto utiliza **Ruff** para linting/formatação e **Basedpyright** para análise estática de tipos.
- Rodar checagens: `ruff check . && basedpyright .`
- Rodar testes: `pytest`

---
Mais detalhes sobre a arquitetura, convenções e regras de negócio podem ser encontrados na pasta `/docs`.
