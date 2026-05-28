import httpClient from "@/api/http-client";
import type { ApiResponse } from "@/api/auth";
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
import { OrderStatus } from "../types/order_types";

const ORDERS_BASE_URL = "/orders";
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
  status: Application["status"] | "CANCELLED";
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

function isMockSession() {
  return localStorage.getItem("token") === "mock-token-mvp";
}

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

function ensureApiSession() {
  if (isMockSession()) {
    throw new Error("API real desativada para usuários mockados.");
  }
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
  return {
    id: apiProvider.id,
    name:
      apiProvider.name ??
      apiProvider.user?.full_name ??
      apiProvider.user_id ??
      "Prestador",
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
    status:
      apiApplication.status === "CANCELLED"
        ? "REJECTED"
        : apiApplication.status,
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

function mapHistoryEvent(apiEvent: ApiHistoryEvent): OrderHistoryEvent {
  const title =
    apiEvent.old_status && apiEvent.old_status !== apiEvent.new_status
      ? `${apiEvent.old_status} -> ${apiEvent.new_status}`
      : apiEvent.new_status;

  return {
    id: apiEvent.id,
    actor: "SYSTEM",
    title,
    description: apiEvent.reason ?? undefined,
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
    ensureApiSession();
    const response = await httpClient.get<OrdersApiResponse>(
      `${ORDERS_BASE_URL}/me`,
    );
    return hydrateApplications(unwrapResponse(response.data).orders.map(mapOrder));
  },

  async getOrderById(id: string): Promise<Order> {
    ensureApiSession();
    const response = await httpClient.get<ApiOrder>(
      `${ORDERS_BASE_URL}/${id}`,
    );
    return hydrateOrderDetails(mapOrder(unwrapResponse(response.data)));
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    ensureApiSession();
    const payload = buildCreatePayload(input);
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}`,
      payload,
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    ensureApiSession();
    const response = await httpClient.put<ApiOrder>(
      `${ORDERS_BASE_URL}/${id}`,
      updates,
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async cancelOrder(id: string): Promise<Order> {
    ensureApiSession();
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}/${id}/cancel`,
      null,
      {
        params: {
          reason: "Cancelado pelo cliente",
        },
      },
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async cancelOrderAsAdmin(id: string, reason: string): Promise<Order> {
    ensureApiSession();
    const response = await httpClient.post<ApiResponse<ApiOrder>>(
      `${ADMIN_BASE_URL}/orders/${id}/cancel`,
      null,
      {
        params: {
          reason,
        },
      },
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async listProviderOrders(): Promise<Order[]> {
    ensureApiSession();
    const response = await httpClient.get<OrdersApiResponse>(
      `${ORDERS_BASE_URL}/providers/me`,
    );
    return unwrapResponse(response.data).orders.map(mapOrder);
  },

  async listAdminOrders(): Promise<Order[]> {
    ensureApiSession();
    const response = await httpClient.get<ApiResponse<OrdersApiResponse>>(
      `${ADMIN_BASE_URL}/orders`,
    );
    return unwrapResponse(response.data).orders.map(mapOrder);
  },

  async getApplications(orderId: string): Promise<Application[]> {
    ensureApiSession();
    const response = await httpClient.get<ApplicationsApiResponse>(
      `${APPLICATIONS_BASE_URL}/${orderId}/list`,
    );
    return unwrapResponse(response.data).applications.map(mapApplication);
  },

  async applyForOrder(orderId: string): Promise<Application> {
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
    ensureApiSession();
    const response = await httpClient.post<ApiApplication>(
      `${APPLICATIONS_BASE_URL}/${applicationId}/reject`,
    );
    return mapApplication(unwrapResponse(response.data));
  },

  async scheduleOrder(orderId: string, scheduledAtValue: string) {
    ensureApiSession();
    await httpClient.post(
      `${SCHEDULING_BASE_URL}/orders/${orderId}`,
      buildSchedulePayload(scheduledAtValue),
    );
    return this.getOrderById(orderId);
  },

  async startOrder(orderId: string) {
    ensureApiSession();
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}/${orderId}/start`,
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async finishOrder(orderId: string) {
    ensureApiSession();
    const response = await httpClient.post<ApiOrder>(
      `${ORDERS_BASE_URL}/${orderId}/finish`,
    );
    return mapOrder(unwrapResponse(response.data));
  },

  async confirmOrder(orderId: string) {
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
    ensureApiSession();
    const response = await httpClient.get<ReviewsApiResponse>(
      `${ORDERS_BASE_URL}/${orderId}/reviews`,
    );

    return unwrapResponse(response.data).reviews.map(mapReview);
  },

  async getHistory(orderId: string): Promise<OrderHistoryEvent[]> {
    ensureApiSession();
    const response = await httpClient.get<HistoryApiResponse>(
      `${ORDERS_BASE_URL}/${orderId}/history`,
    );

    return unwrapResponse(response.data).history.map(mapHistoryEvent);
  },
};
