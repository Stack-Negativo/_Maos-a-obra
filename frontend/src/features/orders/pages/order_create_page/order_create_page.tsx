import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "@/shared/components";
import { listAddresses } from "@/features/addresses/services/addresses_service";
import { listSpecialties } from "@/features/specialties/services/specialties_service";

import { OrderForm } from "../../components";
import { useCreateOrder } from "../../hooks/use_create_order";
import type {
  Address,
  CreateOrderInput,
  Specialty,
} from "../../types/order_types";

import "./order_create_page.css";

export function OrderCreatePage() {
  const navigate = useNavigate();
  const { createOrder, loading } = useCreateOrder();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setPageError(null);
        const [specialtiesData, addressesData] = await Promise.all([
          listSpecialties(),
          listAddresses(),
        ]);
        setSpecialties(specialtiesData);
        setAddresses(addressesData);
      } catch (err) {
        setPageError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar formulário",
        );
      }
    };

    void loadData();
  }, []);

  const handleSubmit = async (data: CreateOrderInput) => {
    try {
      setPageError(null);
      await createOrder(data);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Erro ao criar ordem",
      );
    }
  };

  return (
    <AppShell>
      <div className="order-create-page">
        <div className="order-create-page__header">
          <button
            onClick={() => navigate("/orders/client")}
            className="order-create-page__back-btn"
          >
            Voltar
          </button>
          <div>
            <span className="order-create-page__eyebrow">Cliente</span>
            <h1>Nova ordem de serviço</h1>
            <p>
              Informe o problema, escolha uma especialidade ativa e selecione o
              endereço onde o atendimento deve acontecer.
            </p>
          </div>
        </div>

        {pageError && (
          <div className="order-create-page__error" role="alert">
            {pageError}
          </div>
        )}

        <OrderForm
          specialties={specialties}
          addresses={addresses}
          onSubmit={handleSubmit}
          isLoading={loading}
        />
      </div>
    </AppShell>
  );
}
