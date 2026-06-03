# Módulo de Candidaturas (Applications)

## Objetivo

O módulo de Candidaturas gerencia o interesse de Prestadores (Providers) em executar uma Ordem de Serviço (OS) específica. Ele atua como a ponte entre a fase de visibilidade da OS (`AWAITING_CANDIDATES`) e a fase de seleção (`PROVIDER_SELECTED`).

---

## Estados da Candidatura (ApplicationStatus)

- `PENDING`: Candidatura registrada, aguardando análise do Cliente.
- `ACCEPTED`: Candidatura escolhida pelo Cliente.
- `REJECTED`: Candidatura recusada pelo Cliente ou rejeitada automaticamente após aceite de outro prestador.
- `CANCELLED`: Candidatura retirada pelo próprio Prestador antes do aceite.

---

## Fluxo Operacional

1. **Descoberta**: Prestador visualiza OS no feed (filtrada por especialidade e elegibilidade).
2. **Registro**: Prestador envia candidatura (`PENDING`).
3. **Notificação**: Cliente é notificado sobre nova candidatura.
4. **Análise**: Cliente revisa perfil e histórico do Prestador.
5. **Decisão**:
    - **Aceite**: Cliente aceita a candidatura. A OS transiciona para `PROVIDER_SELECTED`.
    - **Recusa**: Cliente rejeita individualmente (`REJECTED`). A OS permanece aberta.
6. **Finalização do Processo de Seleção**: Ao aceitar um Prestador, todas as outras candidaturas `PENDING` para aquela OS são marcadas como `REJECTED` atomicamente.

---

## Regras de Elegibilidade (Guards)

Para que uma candidatura seja registrada, as seguintes condições devem ser atendidas:

- **Especialidade Compatível**: O Prestador deve possuir em seu perfil a mesma especialidade exigida pela OS.
- **Status do Prestador**: Prestadores suspensos (`is_suspended = True`) não podem se candidatar.
- **Unicidade**: Um Prestador não pode se candidatar duas vezes para a mesma OS.
- **Restrição de Papel**: O Cliente que criou a OS não pode se candidatar a ela (mesmo que tenha perfil de Prestador).
- **Status da OS**: A OS deve estar em um estado que permita candidaturas (`AWAITING_CANDIDATES` ou `AWAITING_SELECTION`). OS em estados terminais ou já em execução não aceitam novas candidaturas.

---

## Concorrência e Atomicidade

- **Race Conditions**: O aceite de uma candidatura deve ser uma operação atômica. Se dois Clientes tentarem aceitar Prestadores diferentes para a mesma OS (ou se o processo de seleção ocorrer simultaneamente a um cancelamento), o sistema deve garantir a consistência via locks pessimistas ou controle de versão no banco.
- **Rejeição em Massa**: O processo de marcar as demais candidaturas como `REJECTED` após um aceite deve ocorrer na mesma transação de banco de dados para evitar estados inconsistentes (ex: OS com status `PROVIDER_SELECTED` mas com múltiplas candidaturas `PENDING`).

---

## Ownership e Permissões

- **Prestador**: É o dono da Candidatura. Somente ele pode cancelar sua própria candidatura enquanto ela estiver `PENDING`.
- **Cliente (Dono da OS)**: Tem permissão para `ACEITAR` ou `REJEITAR` candidaturas vinculadas à sua OS.
- **Admin**: Pode intervir em candidaturas para fins de moderação ou suporte.

---

## Integração com OrderStateMachine

O registro e o aceite de candidaturas disparam mudanças de status na OS:

1. **Primeira Candidatura**: Quando a OS está em `AWAITING_CANDIDATES` e recebe a primeira candidatura, o status da OS deve mudar para `AWAITING_SELECTION`.
2. **Aceite de Candidatura**: Quando uma candidatura é marcada como `ACCEPTED`, o status da OS muda para `PROVIDER_SELECTED`.
3. **Cancelamento da Última Candidatura**: Se a última candidatura ativa for cancelada pelo Prestador, a OS deve retornar para `AWAITING_CANDIDATES`.

---

## Regras de Cancelamento

- Prestadores podem cancelar sua candidatura a qualquer momento enquanto o status for `PENDING`.
- Se uma candidatura for cancelada após o aceite, o fluxo entra em uma regra específica de "Cancelamento de OS Selecionada" (definida em ROS02).
