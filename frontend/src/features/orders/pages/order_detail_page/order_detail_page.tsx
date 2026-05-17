import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type {
  Order,
  Application,
} from "../../types/order_types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../../types/order_types";
import { ApplicationCard } from "../../components";
import { orderService } from "../../services/order_service";

import "./order_detail_page.css";

const STATUS_BADGE_COLORS: Record<
  string,
  "success" | "warning" | "info" | "danger"
> = {
  success: "success",
  warning: "warning",
  info: "info",
  danger: "danger",
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [applications, setApplications] = useState<
    Application[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingApplicationId, setProcessingApplicationId] =
    useState<number | null>(null);

  useEffect(() => {
    const loadOrderData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const orderId = parseInt(id);
        const [orderData, applicationsData] = await Promise.all(
          [
            orderService.getOrderById(orderId),
            orderService.getApplications(orderId),
          ],
        );
        setOrder(orderData);
        setApplications(applicationsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar detalhes da ordem",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadOrderData();
  }, [id]);

  const handleAcceptApplication = async (
    applicationId: number,
  ) => {
    if (!order) return;

    try {
      setProcessingApplicationId(applicationId);
      setError(null);
      const updatedOrder =
        await orderService.acceptApplication(
          order.id,
          applicationId,
        );
      setOrder(updatedOrder);
      const updatedApplications =
        applications.map((app) =>
          app.id === applicationId
            ? { ...app, status: "ACCEPTED" as const }
            : app,
        );
      setApplications(updatedApplications);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao aceitar candidato",
      );
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const handleRejectApplication = async (
    applicationId: number,
  ) => {
    if (!order) return;

    try {
      setProcessingApplicationId(applicationId);
      setError(null);
      const updatedOrder =
        await orderService.rejectApplication(
          order.id,
          applicationId,
        );
      setOrder(updatedOrder);
      const updatedApplications =
        applications.map((app) =>
          app.id === applicationId
            ? { ...app, status: "REJECTED" as const }
            : app,
        );
      setApplications(updatedApplications);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao recusar candidato",
      );
    } finally {
      setProcessingApplicationId(null);
    }
  };

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-page__loading">
          <p>Carregando detalhes da ordem...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-page__error">
          <h2>Ordem não encontrada</h2>
          <button
            onClick={() => navigate("/orders")}
            className="order-detail-page__back-btn"
          >
            ← Voltar para Ordens
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = ORDER_STATUS_LABELS[order.status];
  const statusColor = ORDER_STATUS_COLORS[order.status];
  const badgeColorClass =
    STATUS_BADGE_COLORS[statusColor] || "info";

  return (
    <div className="order-detail-page">
      <header className="order-detail-page__header">
        <button
          onClick={() => navigate("/orders")}
          className="order-detail-page__back-btn"
        >
          ← Voltar
        </button>
        <h1 className="order-detail-page__title">
          {order.title}
        </h1>
        <span
          className={`order-detail-page__badge order-detail-page__badge--${badgeColorClass}`}
        >
          {statusLabel}
        </span>
      </header>

      {error && (
        <div
          className="order-detail-page__error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="order-detail-page__container">
        <section className="order-detail-page__section">
          <h2 className="order-detail-page__section-title">
            Informações da Ordem
          </h2>

          <div className="order-detail-page__info-grid">
            <div className="order-detail-page__info-item">
              <label className="order-detail-page__info-label">
                Descrição
              </label>
              <p className="order-detail-page__info-value">
                {order.description}
              </p>
            </div>

            <div className="order-detail-page__info-item">
              <label className="order-detail-page__info-label">
                Especialidade
              </label>
              <p className="order-detail-page__info-value">
                {order.specialty.name}
              </p>
            </div>

            <div className="order-detail-page__info-item">
              <label className="order-detail-page__info-label">
                Local
              </label>
              <p className="order-detail-page__info-value">
                {order.address.street}, {order.address.number}
                <br />
                {order.address.neighborhood} -{" "}
                {order.address.city}, {order.address.state}
                <br />
                {order.address.zipcode}
              </p>
            </div>

            <div className="order-detail-page__info-item">
              <label className="order-detail-page__info-label">
                Data Preferida
              </label>
              <p className="order-detail-page__info-value">
                {new Date(
                  order.preferredDate,
                ).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {order.selectedProvider && (
              <div className="order-detail-page__info-item">
                <label className="order-detail-page__info-label">
                  Prestador Selecionado
                </label>
                <p className="order-detail-page__info-value">
                  <strong>
                    {order.selectedProvider.name}
                  </strong>
                  <br />⭐{" "}
                  {order.selectedProvider.ratingAverage.toFixed(
                    1,
                  )}{" "}
                  ({order.selectedProvider.completedServices}{" "}
                  serviços)
                </p>
              </div>
            )}

            <div className="order-detail-page__info-item">
              <label className="order-detail-page__info-label">
                Criada em
              </label>
              <p className="order-detail-page__info-value">
                {new Date(order.createdAt).toLocaleDateString(
                  "pt-BR",
                )}
              </p>
            </div>
          </div>
        </section>

        {applications.length > 0 && (
          <section className="order-detail-page__section">
            <h2 className="order-detail-page__section-title">
              Candidatos ({applications.length})
            </h2>
            <div className="order-detail-page__applications">
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  provider={application.provider}
                  status={application.status}
                  onAccept={() =>
                    handleAcceptApplication(
                      application.id,
                    )
                  }
                  onReject={() =>
                    handleRejectApplication(
                      application.id,
                    )
                  }
                  isLoading={
                    processingApplicationId ===
                    application.id
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
