import httpClient from "@/api/http-client";
import type { ApiResponse } from "@/api/auth";
import { isMockMode } from "@/shared/mocks/mock_mode";
import { mockStore } from "@/shared/mocks/mock_store";
import type {
  Order,
  CreateOrderInput,
  Application,
  Provider,
  Specialty,
  Address,
  OrderHistoryEvent,
  OrderReview,
} from "../types/order_types";
import { ORDER_STATUS_LABELS, OrderStatus } from "../types/order_types";

const ORDERS_BASE_URL = "/orders";
const PROVIDERS_BASE_URL = "/providers";
const APPLICATIONS_BASE_URL = "/applications";
const SCHEDULING_BASE_URL = "/scheduling";
const ADMIN_BASE_URL = "/admin";

type ApiSpecialty = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
};

type ApiProviderSpecialty = {
  specialty: ApiSpecialty;
};

type ApiProvider = {
  id: string;
  name?: string;
  user_id?: string;
  user?: {
    full_name?: string;
  };
  bio?: string;
  rating_average?: number;
  total_reviews?: number;
  is_suspended?: boolean;
  specialties?: ApiProviderSpecialty[];
};

type ApiAddress = {
  id: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
};

type ApiApplication = {
  id: string;
  service_order_id: string;
  provider: ApiProvider;
  status: Application["status"];
  created_at: string;
  updated_at?: string;
};

type ApiOrder = {
  id: string;
  title: string;
  description: string;
  status: Order["status"];
  specialty: ApiSpecialty;
  address: ApiAddress;
  provider?: ApiProvider | null;
  preferred_date_start: string;
  scheduled_at?: string | null;
  provider_finished_at?: string | null;
  created_at: string;
  updated_at: string;
  applications?: ApiApplication[];
};

type ApiReview = {
  id: string;
  service_order_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
};

type ApiHistoryEvent = {
  id: string;
  old_status?: string | null;
  new_status: string;
  actor_id?: string | null;
  reason?: string | null;
  created_at: string;
};

function unwrapResponse<T>(response: T | ApiResponse<T>) {
  if (
    response &&
    typeof response === "object" &&
    "success" in response &&
    "data" in response
  ) {
    return (response as ApiResponse<T>).data;
  }

  return response as T;
}

function ensureApiSession() {}

function createProviderPhoto(seed: string) {
  return `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(seed)}`;
}

type OrdersApiResponse = {
  orders: ApiOrder[];
};

type ApplicationsApiResponse = {
  applications: ApiApplication[];
};

type ReviewsApiResponse = {
  reviews: ApiReview[];
};

type HistoryApiResponse = {
  history: ApiHistoryEvent[];
};

function mapProvider(apiProvider: ApiProvider): Provider {
  const name =
    apiProvider.name ??
    apiProvider.user?.full_name ??
    apiProvider.user_id ??
    "Prestador";

  return {
    id: apiProvider.id,
    name,
    photoUrl: createProviderPhoto(name),
    bio: apiProvider.bio,
    ratingAverage: apiProvider.rating_average ?? 0,
    completedServices: apiProvider.total_reviews ?? 0,
    isSuspended: apiProvider.is_suspended ?? false,
    specialties: (apiProvider.specialties ?? []).map(
      (item) => ({
        id: item.specialty.id,
        name: item.specialty.name,
        description: item.specialty.description,
        isActive: item.specialty.is_active,
      }),
    ),
  };
}

function mapAddress(apiAddress: ApiAddress): Address {
  return {
    id: apiAddress.id,
    street: apiAddress.street,
    number: apiAddress.number,
    complement: apiAddress.complement,
    neighborhood: apiAddress.neighborhood,
    city: apiAddress.city,
    state: apiAddress.state,
    zipCode: apiAddress.zip_code,
  };
}

function mapSpecialty(apiSpecialty: ApiSpecialty): Specialty {
  return {
    id: apiSpecialty.id,
    name: apiSpecialty.name,
    description: apiSpecialty.description,
    isActive: apiSpecialty.is_active,
  };
}

function mapApplication(apiApplication: ApiApplication): Application {
  return {
    id: apiApplication.id,
    orderId: apiApplication.service_order_id,
    provider: mapProvider(apiApplication.provider),
    status: apiApplication.status,
    appliedAt: apiApplication.created_at,
    respondedAt: apiApplication.updated_at,
  };
}

function mapReview(apiReview: ApiReview): OrderReview {
  return {
    rating: apiReview.rating,
    comment: apiReview.comment ?? undefined,
    reviewedAt: apiReview.created_at,
  };
}

function formatHistoryStatus(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

function formatHistoryReason(reason?: string | null) {
  const translatedReasons: Record<string, string> = {
    "Application cancelled by provider":
      "Candidatura cancelada pelo prestador.",
    "Application rejected": "Candidatura recusada.",
    "Client confirmed finalization and payment triggered":
      "Cliente confirmou a conclusão do atendimento.",
    "Execution started": "Atendimento iniciado.",
    "First application received": "Primeira candidatura recebida.",
    "No active applications remain": "A ordem voltou a aguardar candidaturas.",
    "Order creation": "Ordem criada pelo cliente.",
    "Provider marked as finished": "Prestador sinalizou a conclusão.",
    "Provider selected": "Prestador selecionado pelo cliente.",
  };

  return reason ? translatedReasons[reason] ?? reason : undefined;
}

function mapHistoryEvent(apiEvent: ApiHistoryEvent): OrderHistoryEvent {
  const title =
    apiEvent.old_status && apiEvent.old_status !== apiEvent.new_status
      ? `${formatHistoryStatus(apiEvent.old_status)} para ${formatHistoryStatus(
          apiEvent.new_status,
        )}`
      : formatHistoryStatus(apiEvent.new_status);

  return {
    id: apiEvent.id,
    actor: "SYSTEM",
    title,
    description: formatHistoryReason(apiEvent.reason),
    createdAt: apiEvent.created_at,
  };
}

function mapOrder(apiOrder: ApiOrder): Order {
  const status =
    apiOrder.status === OrderStatus.IN_PROGRESS && apiOrder.provider_finished_at
      ? OrderStatus.AWAITING_CONFIRMATION
      : apiOrder.status;

  return {
    id: apiOrder.id,
    title: apiOrder.title,
    description: apiOrder.description,
    status,
    specialty: mapSpecialty(apiOrder.specialty),
    address: mapAddress(apiOrder.address),
    selectedProvider: apiOrder.provider ? mapProvider(apiOrder.provider) : undefined,
    preferredDate: apiOrder.preferred_date_start,
    scheduledAt: apiOrder.scheduled_at ?? undefined,
    finishedAt: apiOrder.provider_finished_at ?? undefined,
    createdAt: apiOrder.created_at,
    updatedAt: apiOrder.updated_at,
    applications: apiOrder.applications
      ? apiOrder.applications.map(mapApplication)
      : undefined,
  };
}

function buildCreatePayload(input: CreateOrderInput) {
  const start = new Date(input.preferredDate);
  const end = new Date(input.preferredDate);
  end.setHours(end.getHours() + 8);

  return {
    title: input.title,
    description: input.description,
    specialty_id: input.specialtyId,
    address_id: input.addressId,
    preferred_date_start: start.toISOString(),
    preferred_date_end: end.toISOString(),
  };
}

async function hydrateApplications(orders: Order[]) {
  const hydratedOrders = await Promise.all(
    orders.map(async (order) => {
      try {
        const applications = await orderService.getApplications(order.id);

        return {
          ...order,
          applications,
        };
      } catch {
        return order;
      }
    }),
  );

  return hydratedOrders;
}

async function hydrateOrderDetails(order: Order): Promise<Order> {
  const [applicationsResult, reviewsResult, historyResult] =
    await Promise.allSettled([
      orderService.getApplications(order.id),
      orderService.getReviews(order.id),
      orderService.getHistory(order.id),
    ]);

  return {
    ...order,
    applications:
      applicationsResult.status === "fulfilled"
        ? applicationsResult.value
        : order.applications,
    review:
      reviewsResult.status === "fulfilled"
        ? reviewsResult.value[0] ?? order.review
        : order.review,
    history:
      historyResult.status === "fulfilled"
        ? historyResult.value
        : order.history,
  };
}

function buildSchedulePayload(scheduledAtValue: string) {
  const start = new Date(scheduledAtValue);
  const end = new Date(scheduledAtValue);
  end.setHours(end.getHours() + 2);

  return {
    start_at: start.toISOString(),
    end_at: end.toISOString(),
  };
}

export const orderService = {
  async listOrders(): Promise<Order[]> {
    if (isMockMode()) {
      return mockStore.listOrders("client");
    }

    ensureApiSession();
    const response = await httpClient.get<OrdersApiResponse>(
      `${ORDERS_BASE_URL}/me`,
    );
    return hydrateApplications(unwrapResponse(response.data).orders.map(mapOrder));
  },

  async getOrderById(id: string): Promise<Order> {
    if (isMockMode()) {
      return mockStore.getOrderById(id);
    }

    ensureApiSession();
    const response = await httpClient.get<ApiOrder>(
      `${ORDERS_BASE_URL}/${id}`,
    );
    return hydrateOrderDetails(mapOrder(unwrapResponse(response.data)));
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (isMockMode()) {
      return mockStore.createOrder(input);
    }

    ensureApiSession();
    const payload = buildCreatePayload(input);
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}`,
      payload,
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async cancelOrder(id: string): Promise<Order> {
    if (isMockMode()) {
      return mockStore.cancelOrder(id, "Cancelamento solicitado pelo cliente.");
    }

    ensureApiSession();
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}/${id}/cancel`,
      {
        reason: "Cancelado pelo cliente",
      },
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async cancelOrderAsAdmin(id: string, reason: string): Promise<Order> {
    if (isMockMode()) {
      return mockStore.cancelOrder(id, reason);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiResponse<ApiOrder>>(
      `${ADMIN_BASE_URL}/orders/${id}/cancel`,
      null,
      { params: { reason } },
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async expireOrderAsAdmin(id: string, reason: string): Promise<Order> {
    if (isMockMode()) {
      return mockStore.expireOrder(id, reason);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiResponse<ApiOrder>>(
      `${ADMIN_BASE_URL}/orders/${id}/expire`,
      null,
      { params: { reason } },
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async listProviderOrders(): Promise<Order[]> {
    if (isMockMode()) {
      return mockStore.listOrders("provider");
    }

    ensureApiSession();
    const response = await httpClient.get<OrdersApiResponse>(
      `${ORDERS_BASE_URL}/providers/me`,
    );
    return unwrapResponse(response.data).orders.map(mapOrder);
  },

  async listProviderFeed(): Promise<Order[]> {
    if (isMockMode()) {
      return mockStore.listOrders("provider");
    }

    ensureApiSession();
    const response = await httpClient.get<ApiResponse<OrdersApiResponse>>(
      `${PROVIDERS_BASE_URL}/feed`,
    );
    return unwrapResponse(response.data).orders.map(mapOrder);
  },

  async listAdminOrders(): Promise<Order[]> {
    if (isMockMode()) {
      return mockStore.listOrders("admin");
    }

    ensureApiSession();
    const response = await httpClient.get<ApiResponse<OrdersApiResponse>>(
      `${ADMIN_BASE_URL}/orders`,
    );
    return unwrapResponse(response.data).orders.map(mapOrder);
  },

  async getApplications(orderId: string): Promise<Application[]> {
    if (isMockMode()) {
      return mockStore.getApplications(orderId);
    }

    ensureApiSession();
    const response = await httpClient.get<ApplicationsApiResponse>(
      `${APPLICATIONS_BASE_URL}/${orderId}/list`,
    );
    return unwrapResponse(response.data).applications.map(mapApplication);
  },

  async applyForOrder(orderId: string): Promise<Application> {
    if (isMockMode()) {
      return mockStore.applyForOrder(orderId);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiApplication>(
      `${APPLICATIONS_BASE_URL}/${orderId}/apply`,
    );
    return mapApplication(unwrapResponse(response.data));
  },

  async acceptApplication(
    orderId: string,
    applicationId: string,
  ): Promise<Application> {
    if (isMockMode()) {
      return mockStore.acceptApplication(applicationId);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiApplication>(
      `${APPLICATIONS_BASE_URL}/${applicationId}/accept`,
    );
    return mapApplication(unwrapResponse(response.data));
  },

  async rejectApplication(
    orderId: string,
    applicationId: string,
  ): Promise<Application> {
    if (isMockMode()) {
      return mockStore.rejectApplication(applicationId);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiApplication>(
      `${APPLICATIONS_BASE_URL}/${applicationId}/reject`,
    );
    return mapApplication(unwrapResponse(response.data));
  },

  async cancelApplication(applicationId: string): Promise<Application> {
    if (isMockMode()) {
      return mockStore.cancelApplication(applicationId);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiApplication>(
      `${APPLICATIONS_BASE_URL}/${applicationId}/cancel`,
    );
    return mapApplication(unwrapResponse(response.data));
  },

  async scheduleOrder(orderId: string, scheduledAtValue: string) {
    if (isMockMode()) {
      return mockStore.scheduleOrder(orderId, scheduledAtValue);
    }

    ensureApiSession();
    await httpClient.post(
      `${SCHEDULING_BASE_URL}/orders/${orderId}`,
      buildSchedulePayload(scheduledAtValue),
    );
    return this.getOrderById(orderId);
  },

  async startOrder(orderId: string) {
    if (isMockMode()) {
      return mockStore.startOrder(orderId);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}/${orderId}/start`,
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async finishOrder(orderId: string) {
    if (isMockMode()) {
      return mockStore.finishOrder(orderId);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}/${orderId}/finish`,
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async confirmOrder(orderId: string) {
    if (isMockMode()) {
      return mockStore.confirmOrder(orderId);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}/${orderId}/confirm`,
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async createReview(
    orderId: string,
    review: {
      rating: number;
      comment?: string;
    },
  ) {
    if (isMockMode()) {
      return mockStore.createReview(orderId, review);
    }

    ensureApiSession();
    const response = await httpClient.post<ApiReview>(
      `${ORDERS_BASE_URL}/${orderId}/reviews`,
      {
        rating: review.rating,
        comment: review.comment,
        direction: "CLIENT_TO_PROVIDER",
      },
    );
    return unwrapResponse(response.data);
  },

  async getReviews(orderId: string): Promise<OrderReview[]> {
    if (isMockMode()) {
      const order = mockStore.getOrderById(orderId);
      return order.review ? [order.review] : [];
    }

    ensureApiSession();
    const response = await httpClient.get<ReviewsApiResponse>(
      `${ORDERS_BASE_URL}/${orderId}/reviews`,
    );

    return unwrapResponse(response.data).reviews.map(mapReview);
  },

  async getHistory(orderId: string): Promise<OrderHistoryEvent[]> {
    if (isMockMode()) {
      return mockStore.getOrderById(orderId).history ?? [];
    }

    ensureApiSession();
    const response = await httpClient.get<HistoryApiResponse>(
      `${ORDERS_BASE_URL}/${orderId}/history`,
    );

    return unwrapResponse(response.data).history.map(mapHistoryEvent);
  },
};
