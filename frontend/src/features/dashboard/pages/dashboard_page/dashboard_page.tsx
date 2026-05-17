import { Link } from "react-router-dom";

import { AppShell } from "@/shared/components";

import "./dashboard_page.css";

export function DashboardPage() {
  return (
    <AppShell>
      <section className="dashboard-page">
        <div className="dashboard-page__header">
          <div>
            <h1>Painel do MVP</h1>
            <p>
              Valide os fluxos frontend disponiveis antes da camada de ordens
              de servico: autenticacao, especialidades e enderecos mockados.
            </p>
          </div>
        </div>

        <section className="dashboard-page__metrics">
          <article className="dashboard-metric">
            <span>Especialidades</span>
            <strong>5</strong>
            <small>catalogo mock/API</small>
          </article>
          <article className="dashboard-metric dashboard-metric--warning">
            <span>Enderecos</span>
            <strong>2+</strong>
            <small>localStorage</small>
          </article>
          <article className="dashboard-metric dashboard-metric--success">
            <span>Sessao</span>
            <strong>OK</strong>
            <small>rota protegida</small>
          </article>
          <article className="dashboard-metric dashboard-metric--info">
            <span>Prestadores</span>
            <strong>3+</strong>
            <small>perfil mockado</small>
          </article>
        </section>

        <section className="dashboard-page__content">
          <div>
            <h2>Fluxos disponiveis</h2>
            <div className="dashboard-page__cards">
              <article className="dashboard-card">
                <div>
                  <strong>Especialidades</strong>
                  <p>
                    Consulte o catalogo, teste filtros e valide o estado de
                    carregamento com fallback mockado.
                  </p>
                </div>
                <Link to="/specialties">Ver especialidades</Link>
              </article>

              <article className="dashboard-card dashboard-card--highlight">
                <div>
                  <strong>Enderecos</strong>
                  <p>
                    Cadastre locais de atendimento mockados, preparando a
                    criacao futura de ordens de servico.
                  </p>
                </div>
                <Link to="/addresses">Gerenciar enderecos</Link>
              </article>

              <article className="dashboard-card">
                <div>
                  <strong>Prestadores</strong>
                  <p>
                    Simule perfis profissionais com bio e especialidades antes
                    do fluxo real de candidatura.
                  </p>
                </div>
                <Link to="/providers">Ver prestadores</Link>
              </article>

              <article className="dashboard-card dashboard-card--highlight">
                <div>
                  <strong>Ordens de Serviço</strong>
                  <p>
                    Crie, gerencie e acompanhe suas ordens de serviço. Revise
                    candidatos e selecione prestadores qualificados.
                  </p>
                </div>
                <Link to="/orders">Gerenciar ordens</Link>
              </article>
            </div>
          </div>

          <aside className="dashboard-page__side">
            <h2>Acoes rapidas</h2>
            <Link to="/specialties">Revisar catalogo</Link>
            <Link to="/addresses">Adicionar endereco</Link>
            <Link to="/providers">Cadastrar prestador</Link>
            <Link to="/orders">Nova ordem de serviço</Link>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
