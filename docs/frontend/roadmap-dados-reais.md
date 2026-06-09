# Roadmap para Dados Reais

Este roteiro orienta a próxima etapa: substituir o modo mockado por dados reais sem alterar a experiência já validada no frontend.

## 1. Preparar Ambiente

- Definir `VITE_DATA_MODE=api` no ambiente do frontend.
- Confirmar `VITE_API_BASE_URL` apontando para `/api/v1`.
- Rodar migrations do backend e criar seed mínimo de demonstração.

## 2. Validar Contratos

- Comparar `frontend/src/features/**/services` com `docs/api/endpoints.md`.
- Garantir formato `{ success, data, error }` em todas as respostas.
- Manter os mappers atuais para isolar diferenças entre API e UI.

## 3. Seed Inicial Recomendado

- Admin: conta administrativa ativa.
- Cliente: usuário com ao menos um endereço.
- Prestador: usuário com perfil ativo e especialidades.
- Especialidades ativas: Elétrica, Hidráulica e Pintura.
- Ordens em estados: aguardando candidatos, aguardando seleção, agendada e finalizada.

## 4. Fluxos Obrigatórios

- Login e cadastro.
- Endereços do cliente.
- Criação de ordem.
- Feed do prestador por especialidade.
- Candidatura, aceite, agendamento, início, finalização, pagamento mockado e avaliação.
- Painel admin com ordens, prestadores, suspensão e exclusão quando permitido.

## 5. Critério de Troca

O mock só deve ser desligado quando todos os fluxos acima funcionarem via API real mantendo a mesma navegação e os mesmos estados visuais.
