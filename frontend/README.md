# Frontend - Mãos à Obra

SPA em React + Vite para testar os fluxos de cliente, prestador e admin do sistema.

## Modo mock

Por padrão o frontend roda com dados mockados em `localStorage`, sem depender do backend. Isso permite validar cadastro, login, endereços, especialidades, prestadores, ordens, candidaturas, agendamento, finalização, avaliação e pagamento mock.

```bash
npm install
npm run dev
```

Contas prontas para teste:

- Admin: `admin@maosaobra.com.br` / `Admin12345`
- Cliente: `cliente@maosaobra.com.br` / `Cliente123`
- Prestador: `prestador@maosaobra.com.br` / `Prestador123`

Para voltar a consumir a API real, rode com:

```bash
VITE_DATA_MODE=api npm run dev
```

## Validação

```bash
npm run build
npm run lint
```
