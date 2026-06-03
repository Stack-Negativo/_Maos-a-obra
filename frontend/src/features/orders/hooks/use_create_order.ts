import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { listAddresses } from "@/features/addresses/services/addresses_service";
import { listSpecialties } from "@/features/specialties/services/specialties_service";

import { orderService } from "../services/order_service";
import type { CreateOrderInput } from "../types/order_types";

export function useCreateOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (data: CreateOrderInput): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const [specialties, addresses] = await Promise.all([
        listSpecialties(),
        listAddresses(),
      ]);
      const specialty = specialties.find(
        (item) => item.id === data.specialtyId,
      );
      const address = addresses.find((item) => item.id === data.addressId);

      if (!specialty || !address) {
        throw new Error("Especialidade ou endereço inválido.");
      }

      await orderService.createOrder(data);

      navigate("/orders/client");
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
