import { useCallback, useEffect, useState } from "react";

import { orderService } from "../services/order_service";
import type { Order, Application } from "../types/order_types";

export function useProviderOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const providerOrders = await orderService.listProviderOrders();
      setOrders(providerOrders);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar ordens do prestador",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchProviderOrders();
    });
  }, [fetchProviderOrders]);

  async function applyForOrder(orderId: string): Promise<Application> {
    const application = await orderService.applyForOrder(orderId);
    await fetchProviderOrders();
    return application;
  }

  return {
    orders,
    loading,
    error,
    refresh: fetchProviderOrders,
    applyForOrder,
  };
}
