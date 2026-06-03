import { useCallback, useEffect, useState } from "react";

import type { Order, OrderReview, Provider } from "../types/order_types";
import { orderService } from "../services/order_service";

type OrderSource = "client" | "provider" | "admin";

export function useOrdersMutations(
  _currentProvider?: Provider,
  source: OrderSource = "client",
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const syncApiOrders = useCallback(async () => {
    setLoading(true);
    try {
      const apiOrders =
        source === "admin"
          ? await orderService.listAdminOrders()
          : source === "provider"
            ? await orderService.listProviderOrders()
            : await orderService.listOrders();

      setOrders(apiOrders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    queueMicrotask(() => {
      void syncApiOrders();
    });
  }, [syncApiOrders]);

  async function applyForOrder(orderId: string) {
    await orderService.applyForOrder(orderId);
    await syncApiOrders();
  }

  async function acceptApplication(_orderId: string, applicationId: string) {
    await orderService.acceptApplication(_orderId, applicationId);
    await syncApiOrders();
  }

  async function rejectApplication(_orderId: string, applicationId: string) {
    await orderService.rejectApplication(_orderId, applicationId);
    await syncApiOrders();
  }

  async function cancelApplication(_orderId: string, applicationId: string) {
    await orderService.cancelApplication(applicationId);
    await syncApiOrders();
  }

  async function scheduleOrder(orderId: string, scheduledAtValue?: string) {
    if (!scheduledAtValue) {
      throw new Error("Informe a data de agendamento.");
    }

    await orderService.scheduleOrder(orderId, scheduledAtValue);
    await syncApiOrders();
  }

  async function startOrder(orderId: string) {
    await orderService.startOrder(orderId);
    await syncApiOrders();
  }

  async function finishOrder(orderId: string) {
    await orderService.finishOrder(orderId);
    await syncApiOrders();
  }

  async function confirmFinished(orderId: string, review?: OrderReview) {
    await orderService.confirmOrder(orderId);

    if (review) {
      await orderService.createReview(orderId, {
        rating: review.rating,
        comment: review.comment,
      });
    }

    await syncApiOrders();
  }

  async function cancelOrder(
    orderId: string,
    reason = "Cancelamento solicitado.",
    actor?: string,
  ) {
    void actor;

    if (source === "admin") {
      await orderService.cancelOrderAsAdmin(orderId, reason);
    } else {
      await orderService.cancelOrder(orderId);
    }

    await syncApiOrders();
  }

  async function expireOrder(
    orderId: string,
    reason = "Expiração administrativa.",
  ) {
    await orderService.expireOrderAsAdmin(orderId, reason);
    await syncApiOrders();
  }

  const refreshOrderById = useCallback(
    async (orderId: string) => {
      const apiOrder = await orderService.getOrderById(orderId);
      setOrders((currentOrders) => [
        apiOrder,
        ...currentOrders.filter((order) => order.id !== orderId),
      ]);
      return apiOrder;
    },
    [],
  );

  function getOrderById(orderId: string) {
    return orders.find((order) => order.id === orderId) ?? null;
  }

  return {
    orders,
    loading,
    applyForOrder,
    acceptApplication,
    rejectApplication,
    cancelApplication,
    scheduleOrder,
    startOrder,
    finishOrder,
    confirmFinished,
    cancelOrder,
    expireOrder,
    getOrderById,
    refreshOrderById,
  };
}
