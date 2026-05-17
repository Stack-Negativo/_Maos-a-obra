import { useState } from "react";
import { useOrders } from "../hooks";
import { OrdersCard } from "../components";
import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import "./orders_page/orders_page.css";

export function OrdersAdminPage() {
  const { orders, loading, error, refresh } = useOrders();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    string | null
  >(null);

  const filteredOrders = orders
    .filter((order) =>
      order.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((order) =>
      filterStatus ? order.status === filterStatus : true
    );

  const statusCounts = {
    all: orders.length,
    CREATED: orders.filter((o) => o.status === "CREATED").length,
    PROVIDER_SELECTED: orders.filter(
      (o) => o.status === "PROVIDER_SELECTED",
    ).length,
    IN_PROGRESS: orders.filter(
      (o) => o.status === "IN_PROGRESS",
    ).length,
    FINISHED: orders.filter((o) => o.status === "FINISHED")
      .length,
  };

  return (
    <AppShell>
      <section className="orders-page">
        <header className="orders-page__header">
          <div>
            <h1>Painel Administrativo - Ordens de Serviço</h1>
            <p>
              Monitore todas as ordens de serviço, prestadores e
              clientes do sistema. Gerencie conflitos e validações.
            </p>
            <p className="orders-page__summary">
              {orders.length} ordem{orders.length === 1 ? "" : "s"}{" "}
              no sistema
            </p>
          </div>
        </header>

        <section className="orders-page__filters">
          <Input
            placeholder="Buscar ordens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            aria-label="Buscar ordens"
          />
          <div className="orders-page__filter-tabs">
            <button
              className={`orders-page__filter-tab ${
                filterStatus === null ? "active" : ""
              }`}
              onClick={() => setFilterStatus(null)}
            >
              Todas ({statusCounts.all})
            </button>
            <button
              className={`orders-page__filter-tab ${
                filterStatus === "CREATED" ? "active" : ""
              }`}
              onClick={() => setFilterStatus("CREATED")}
            >
              Criadas ({statusCounts.CREATED})
            </button>
            <button
              className={`orders-page__filter-tab ${
                filterStatus === "PROVIDER_SELECTED"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setFilterStatus("PROVIDER_SELECTED")
              }
            >
              Com Prestador ({statusCounts.PROVIDER_SELECTED})
            </button>
            <button
              className={`orders-page__filter-tab ${
                filterStatus === "IN_PROGRESS"
                  ? "active"
                  : ""
              }`}
              onClick={() => setFilterStatus("IN_PROGRESS")}
            >
              Em Andamento ({statusCounts.IN_PROGRESS})
            </button>
            <button
              className={`orders-page__filter-tab ${
                filterStatus === "FINISHED" ? "active" : ""
              }`}
              onClick={() => setFilterStatus("FINISHED")}
            >
              Finalizadas ({statusCounts.FINISHED})
            </button>
          </div>
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
            Carregando ordens...
          </p>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-page__empty">
            <p>
              {search
                ? "Nenhuma ordem encontrada com esse termo."
                : filterStatus
                  ? "Nenhuma ordem com este status."
                  : "Nenhuma ordem no sistema."}
            </p>
          </div>
        ) : (
          <div className="orders-page__list">
            {filteredOrders.map((order) => (
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
