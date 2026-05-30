# Mãos à Obra

Sistema de intermediação de serviços residenciais entre clientes e prestadores. O projeto conecta solicitações de serviço a profissionais, com suporte a candidaturas, agendamento, auditoria de status, pagamento mock e avaliação.

## Estrutura

- `/backend`: API RESTful em FastAPI com arquitetura inspirada em Clean Architecture.
- `/frontend`: SPA em React + Vite.
- `/docs`: documentação técnica, domínio e regras de negócio.

## Frontend mockado

O frontend roda em modo mock por padrão, usando `localStorage`, para permitir validação completa sem backend.

```bash
cd frontend
npm install
npm run dev
```

Contas de teste:

- Admin: `admin@maosaobra.com.br` / `Admin12345`
- Cliente: `cliente@maosaobra.com.br` / `Cliente123`
- Prestador: `prestador@maosaobra.com.br` / `Prestador123`

Para consumir a API real, configure `VITE_DATA_MODE=api`.

## Docker

```bash
docker-compose up --build
```
