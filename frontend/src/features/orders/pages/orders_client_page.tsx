import { useNavigate } from "react-router-dom";
import { useOrders } from "../hooks";
import { OrdersCard } from "../components";
import { AppShell } from "@/shared/components";

import "./orders_page/orders_page.css";

export function OrdersClientPage() {
  const navigate = useNavigate();
  const { orders, loading, error, refresh } = useOrders();

  return (
    <AppShell>
      <section className="orders-page">
        <header className="orders-page__header">
          <div>
            <h1>Minhas Ordens de Serviço</h1>
            <p>
              Crie e gerencie suas ordens de serviço. Revise
              candidatos e selecione prestadores qualificados
              para sua demanda.
            </p>
            <p className="orders-page__summary">
              {orders.length} ordem{orders.length === 1 ? "" : "s"}{" "}
              no total
            </p>
          </div>

          <div className="orders-page__header-actions">
            <button
              className="orders-page__new-order-btn"
              onClick={() => navigate("/orders/create")}
            >
              + Nova Ordem
            </button>
          </div>
        </header>

        {error && (
          <div
            className="orders-page__error"
            role="alert"
          >
            <p>{error}</p>
            <button
              onClick={() => void refresh()}
              className="orders-page__retry-btn"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {loading ? (
          <p className="orders-page__state">
            Carregando ordens...
          </p>
        ) : orders.length === 0 ? (
          <div className="orders-page__empty">
            <p>Você não tem nenhuma ordem de serviço ainda.</p>
            <button
              className="orders-page__empty-btn"
              onClick={() => navigate("/orders/create")}
            >
              Criar Primeira Ordem
            </button>
          </div>
        ) : (
          <div className="orders-page__list">
            {orders.map((order) => (
              <OrdersCard
                key={order.id}
                order={order}
                onRefresh={() => void refresh()}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
