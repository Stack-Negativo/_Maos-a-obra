# Mãos a Obra

Sistema de intermediação de serviços residenciais entre tomadores e prestadores. O projeto tem como objetivo conectar clientes a prestadores de serviços de forma segura, com suporte a agendamento, auditoria de status, pagamento (mock) e sistema de avaliação 360.

## Estrutura do Repositório

- `/backend`: API RESTful construída em FastAPI com arquitetura limpa (Domain-Driven Design simplificado).
- `/frontend`: Aplicação SPA (React + Vite).
- `/docs`: Documentação técnica detalhada sobre arquitetura, domínio e regras de negócio.

## Pré-requisitos
- Docker & Docker Compose
- Node.js (para o frontend)
- Python 3.12+ (para o backend)

## Como rodar
Utilize o docker-compose para subir toda a infraestrutura necessária:
```bash
docker-compose up --build
```

---
Este projeto é parte de uma atividade acadêmica de Engenharia de Software.
