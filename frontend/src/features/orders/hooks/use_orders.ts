import { useCallback, useEffect, useState } from "react";
import { orderService } from "../services/order_service";
import type { Order } from "../types/order_types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const orders = await orderService.listOrders();
      setOrders(orders);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar ordens",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchOrders();
    });
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
  };
}
