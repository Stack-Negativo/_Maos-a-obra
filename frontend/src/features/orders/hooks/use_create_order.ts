import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { CreateOrderInput } from "../types/order_types";

export function useCreateOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (
    data: CreateOrderInput,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Substituir por chamada de API
      // const response = await ordersApi.createOrder(data);
      console.log("Criando ordem:", data);
      navigate("/orders");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar ordem";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    loading,
    error,
  };
}
