import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Address,
  CreateOrderInput,
  Specialty,
} from "../../types/order_types";
import { OrderForm } from "../../components";
import { useCreateOrder } from "../../hooks/use_create_order";
import { orderService } from "../../services/order_service";

import "./order_create_page.css";

// TODO: Substituir por chamada de API
const MOCK_SPECIALTIES: Specialty[] = [
  {
    id: 1,
    name: "Encanador",
    description: "Serviços de encanamento",
    isActive: true,
  },
  {
    id: 2,
    name: "Eletricista",
    description: "Serviços de eletricidade",
    isActive: true,
  },
  {
    id: 3,
    name: "Pintor",
    description: "Serviços de pintura",
    isActive: true,
  },
];

const MOCK_ADDRESSES: Address[] = [
  {
    id: 1,
    street: "Rua das Flores",
    number: "123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    zipcode: "01310-100",
  },
  {
    id: 2,
    street: "Avenida Paulista",
    number: "1578",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    zipcode: "01311-200",
  },
];

export function OrderCreatePage() {
  const navigate = useNavigate();
  const { createOrder, loading, error } = useCreateOrder();
  const [specialties, setSpecialties] = useState<Specialty[]>(
    [],
  );
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [pageError, setPageError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setPageError(null);
        // TODO: Substituir por chamadas de API
        // const [specialtiesData, addressesData] = await Promise.all([
        //   specialtyService.listSpecialties(),
        //   addressService.listAddresses(),
        // ]);
        setSpecialties(MOCK_SPECIALTIES);
        setAddresses(MOCK_ADDRESSES);
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

  const handleSubmit = async (
    data: CreateOrderInput,
  ) => {
    try {
      setPageError(null);
      // TODO: Substituir por chamada de API
      // await orderService.createOrder(data);
      console.log("Criando ordem:", data);
      navigate("/orders");
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Erro ao criar ordem",
      );
    }
  };

  return (
    <div className="order-create-page">
      <div className="order-create-page__header">
        <button
          onClick={() => navigate("/orders")}
          className="order-create-page__back-btn"
        >
          ← Voltar
        </button>
      </div>

      {pageError && (
        <div
          className="order-create-page__error"
          role="alert"
        >
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
  );
}
