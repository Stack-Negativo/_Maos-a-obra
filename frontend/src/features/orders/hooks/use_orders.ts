import { useCallback, useEffect, useState } from "react";
import type {
  Order,
  Address,
  Specialty,
  OrderStatus,
} from "../types/order_types";
import { OrderStatus as OrderStatusEnum } from "../types/order_types";

interface MockOrder extends Order {
  userId: number;
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 1,
    userId: 1,
    title: "Conserto de torneira",
    description: "Torneira da cozinha está vazando há uma semana.",
    status: OrderStatusEnum.CREATED,
    specialty: {
      id: 1,
      name: "Encanador",
      description: "Serviços de encanamento",
      isActive: true,
    },
    address: {
      id: 1,
      street: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipcode: "01310-100",
    },
    preferredDate: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    title: "Reparo de tomadas",
    description: "Duas tomadas não funcionam mais no quarto.",
    status: OrderStatusEnum.PROVIDER_SELECTED,
    specialty: {
      id: 2,
      name: "Eletricista",
      description: "Serviços de eletricidade",
      isActive: true,
    },
    address: {
      id: 1,
      street: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipcode: "01310-100",
    },
    selectedProvider: {
      id: 1,
      name: "João Eletricista",
      ratingAverage: 4.8,
      completedServices: 127,
      isSuspended: false,
      specialties: [
        {
          id: 2,
          name: "Eletricista",
          description: "Serviços de eletricidade",
          isActive: true,
        },
      ],
    },
    preferredDate: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function useOrders(userId?: number) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Substituir por chamada de API
      // const response = await ordersApi.listOrders();
      const mockOrders = userId
        ? MOCK_ORDERS.filter(
            (o) => o.userId === userId,
          )
        : MOCK_ORDERS;
      setOrders(mockOrders);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar ordens",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
  };
}
