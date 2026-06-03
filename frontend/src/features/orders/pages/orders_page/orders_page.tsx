import { Link } from "react-router-dom";
import { AppShell } from "@/shared/components";
import { useOrders } from "../../hooks/use_orders";
import { OrderCard } from "../../components";

import "./orders_page.css";

export function OrdersPage() {
  const { orders, loading, error, refresh } = useOrders();

  return (
    <AppShell>
      <section className="orders-page">
        <header className="orders-page__header">
          <div>
            <h1>Minhas Ordens de Serviço</h1>
            <p>
              Acompanhe suas ordens e gerencie os prestadores.
            </p>
            <p className="orders-page__summary">
              {orders.length} ordem{orders.length === 1 ? "" : "s"} no total
            </p>
          </div>

          <Link to="/orders/create" className="orders-page__create-btn">
            + Nova Ordem
          </Link>
        </header>

        <div className="orders-page__toolbar">
          <button
            onClick={() => {
              void refresh();
            }}
            disabled={loading}
            className="orders-page__refresh-btn"
          >
            {loading ? "Atualizando..." : "🔄 Atualizar"}
          </button>
        </div>

        {error && (
          <div className="orders-page__error" role="alert">
            {error}
          </div>
        )}

        {loading && !orders.length ? (
          <div className="orders-page__loading">
            <p>Carregando suas ordens...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-page__empty">
            <p>Você ainda não tem nenhuma ordem de serviço.</p>
            <Link to="/orders/create" className="orders-page__cta">
              Criar sua primeira ordem
            </Link>
          </div>
        ) : (
          <div className="orders-page__list">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
