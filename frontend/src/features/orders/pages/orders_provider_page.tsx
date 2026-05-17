import { useState } from "react";
import { useOrders } from "../hooks";
import { OrdersCard } from "../components";
import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import "./orders_page/orders_page.css";

export function OrdersProviderPage() {
  const { orders, loading, error, refresh } = useOrders();
  const [search, setSearch] = useState("");

  const availableOrders = orders.filter((order) =>
    order.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <section className="orders-page">
        <header className="orders-page__header">
          <div>
            <h1>Feed de Ordens de Serviço</h1>
            <p>
              Revise as ordens disponíveis em sua especialidade
              e candidate-se para prestar seus serviços.
            </p>
            <p className="orders-page__summary">
              {availableOrders.length} ordem
              {availableOrders.length === 1 ? "" : "s"} disponível
              {availableOrders.length === 1 ? "" : "is"}
            </p>
          </div>
        </header>

        <section className="orders-page__filters">
          <Input
            placeholder="Buscar ordens por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            aria-label="Buscar ordens"
          />
        </section>

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
            Carregando ordens disponíveis...
          </p>
        ) : availableOrders.length === 0 ? (
          <div className="orders-page__empty">
            <p>
              {search
                ? "Nenhuma ordem encontrada com esse termo."
                : "Nenhuma ordem disponível no momento."}
            </p>
          </div>
        ) : (
          <div className="orders-page__list">
            {availableOrders.map((order) => (
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
