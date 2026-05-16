# Fluxos do Sistema

## Objetivo

Este documento descreve os fluxos operacionais principais, utilizando nomenclatura funcional em Português e mapeamento técnico em Inglês.

---

# Fluxo 01 — Cadastro de Usuário (User Registration)

1. Usuário informa dados básicos.
2. Sistema valida unicidade de e-mail e força de senha.
3. Sistema cria registro na tabela `users`.
4. Sistema retorna autenticação JWT.

---

# Fluxo 02 — Tornar-se Prestador (Become Provider)

**Pré-condição:** Usuário autenticado e NÃO ser Admin.

1. Usuário informa bio e seleciona especialidades.
2. Sistema valida especialidades.
3. Sistema cria registro na tabela `providers` vinculado ao `user_id`.
4. Sistema vincula especialidades na tabela `providers_specialties`.

---

# Fluxo 03 — Criação de Ordem de Serviço (Service Order Creation)

**Pré-condição:** Usuário autenticado (Client) e NÃO ser Admin.

1. Cliente informa: título, descrição, especialidade, endereço (`address_id`), e data desejada (`preferred_date`).
2. Sistema valida dados e especialidade.
3. Sistema cria registro na tabela `service_orders` com status `CREATED`.

---

# Fluxo 04 — Candidatura à Ordem (Application)

1. Provider visualiza OS no feed.
2. Provider envia candidatura (`Application`).
3. Sistema valida se Provider tem a especialidade exigida e não tem conflito de agenda.
4. Sistema registra na tabela `applications` com status `PENDING`.

---

# Fluxo 05 — Seleção e Agendamento (Selection & Scheduling)

1. Cliente escolhe um Provider entre os candidatos.
2. Sistema marca a aplicação como `ACCEPTED` e as demais como `REJECTED`.
3. Sistema altera status da OS para `PROVIDER_SELECTED`.
4. **Agendamento:** Após contato, o horário oficial é registrado no campo `scheduled_at` da OS.
5. Sistema cria bloqueio na tabela `schedules` para o Provider.
6. Sistema altera status da OS para `SCHEDULED`.

---

# Fluxo 06 — Execução e Finalização (Execution & Finish)

1. Provider inicia serviço: status muda para `IN_PROGRESS`.
2. Provider finaliza serviço: registra `finished_at` e aguarda confirmação.
3. Cliente confirma: status muda para `FINISHED`.
4. Sistema inicia Fluxo de Pagamento e libera Avaliação.
