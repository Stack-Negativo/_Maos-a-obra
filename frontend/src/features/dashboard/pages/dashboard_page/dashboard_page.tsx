import { Link, Navigate } from "react-router-dom";

import { useAuthContext } from "@/app/providers/auth_provider";
import { UserRole } from "@/features/auth/types/auth_types";
import { useOrdersMutations } from "@/features/orders/hooks";
import { OrderStatus } from "@/features/orders/types/order_types";
import { useSpecialties } from "@/features/specialties/hooks/use_specialties";
import { AppShell } from "@/shared/components";

import "./dashboard_page.css";

export function DashboardPage() {
  const { user } = useAuthContext();
  const { orders } = useOrdersMutations(undefined, "admin");
  const { allSpecialties, requests } = useSpecialties();

  if (user?.role === UserRole.CLIENT) {
    return <Navigate to="/orders/client" replace />;
  }

  if (user?.role === UserRole.PROVIDER) {
    return <Navigate to="/orders/provider" replace />;
  }

  if (user?.role === UserRole.ADMIN) {
    return <Navigate to="/orders/admin" replace />;
  }

  const activeOrders = orders.filter(
    (order) =>
      ![
        OrderStatus.FINISHED,
        OrderStatus.CANCELLED,
        OrderStatus.EXPIRED,
      ].includes(order.status),
  );
  const selectionQueue = orders.filter(
    (order) => order.status === OrderStatus.AWAITING_SELECTION,
  );
  const schedulingQueue = orders.filter(
    (order) => order.status === OrderStatus.PROVIDER_SELECTED,
  );
  const confirmationQueue = orders.filter(
    (order) => order.status === OrderStatus.AWAITING_CONFIRMATION,
  );
  const pendingSpecialtyRequests = requests.filter(
    (request) => request.status === "PENDING",
  );
  const activeSpecialties = allSpecialties.filter(
    (specialty) => specialty.isActive,
  );
  const finishedOrders = orders.filter(
    (order) => order.status === OrderStatus.FINISHED,
  );

  return (
    <AppShell>
      <section className="dashboard-page dashboard-page--admin">
        <div className="dashboard-page__header">
          <div>
            <span className="dashboard-page__eyebrow">Administração</span>
            <h1>Central de Operação</h1>
            <p>
              Controle geral do MVP: filas operacionais, catálogo,
              prestadores, auditoria de ordens e solicitações pendentes.
            </p>
          </div>
          <Link className="dashboard-page__primary-link" to="/orders/admin">
            Auditar ordens
          </Link>
        </div>

        <section className="dashboard-page__metrics">
          <article className="dashboard-metric">
            <span>Ordens ativas</span>
            <strong>{activeOrders.length}</strong>
            <small>{orders.length} ordens no total</small>
          </article>
          <article className="dashboard-metric dashboard-metric--warning">
            <span>Fila do cliente</span>
            <strong>{selectionQueue.length + confirmationQueue.length}</strong>
            <small>seleção ou confirmação pendente</small>
          </article>
          <article className="dashboard-metric dashboard-metric--info">
            <span>Agendamento</span>
            <strong>{schedulingQueue.length}</strong>
            <small>aguardando horário oficial</small>
          </article>
          <article className="dashboard-metric dashboard-metric--success">
            <span>Catálogo ativo</span>
            <strong>{activeSpecialties.length}</strong>
            <small>{pendingSpecialtyRequests.length} solicitação pendente</small>
          </article>
        </section>

        <section className="dashboard-page__operations">
          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <h2>Filas de atenção</h2>
                <p>Estados que exigem ação para o fluxo continuar.</p>
              </div>
            </div>
            <div className="dashboard-queue">
              <Link to="/orders/admin">
                <span>Escolha de prestador</span>
                <strong>{selectionQueue.length}</strong>
              </Link>
              <Link to="/orders/admin">
                <span>Agendamento oficial</span>
                <strong>{schedulingQueue.length}</strong>
              </Link>
              <Link to="/orders/admin">
                <span>Confirmação de finalização</span>
                <strong>{confirmationQueue.length}</strong>
              </Link>
              <Link to="/specialties">
                <span>Novas especialidades</span>
                <strong>{pendingSpecialtyRequests.length}</strong>
              </Link>
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <h2>Saúde operacional</h2>
                <p>Resumo do ciclo de servico com dados do backend.</p>
              </div>
            </div>
            <div className="dashboard-health">
              <div>
                <span>Finalizadas</span>
                <strong>{finishedOrders.length}</strong>
              </div>
              <div>
                <span>Canceladas</span>
                <strong>
                  {
                    orders.filter(
                      (order) => order.status === OrderStatus.CANCELLED,
                    ).length
                  }
                </strong>
              </div>
              <div>
                <span>Expiradas</span>
                <strong>
                  {
                    orders.filter(
                      (order) => order.status === OrderStatus.EXPIRED,
                    ).length
                  }
                </strong>
              </div>
            </div>
          </article>
        </section>

        <section className="dashboard-page__content">
          <div>
            <h2>Controles administrativos</h2>
            <div className="dashboard-page__cards">
              <article className="dashboard-card dashboard-card--highlight">
                <div>
                  <strong>Ordens de Serviço</strong>
                  <p>
                    Monitore candidaturas, seleção, agendamento, execução,
                    confirmação do cliente, pagamentos e histórico.
                  </p>
                </div>
                <Link to="/orders/admin">Auditar ordens</Link>
              </article>

              <article className="dashboard-card">
                <div>
                  <strong>Especialidades</strong>
                  <p>
                    Crie, ative, inative e aprove solicitações enviadas por
                    prestadores.
                  </p>
                </div>
                <Link to="/specialties">Gerir catálogo</Link>
              </article>

              <article className="dashboard-card">
                <div>
                  <strong>Prestadores</strong>
                  <p>
                    Consulte perfis profissionais, notas, suspensões e
                    especialidades vinculadas.
                  </p>
                </div>
                <Link to="/providers">Ver prestadores</Link>
              </article>
            </div>
          </div>

          <aside className="dashboard-page__side">
            <h2>Ações rápidas</h2>
            <Link to="/orders/admin">Auditar ordens</Link>
            <Link to="/specialties">Gerir especialidades</Link>
            <Link to="/providers">Ver prestadores</Link>
            <Link to="/addresses">Ver endereços</Link>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
