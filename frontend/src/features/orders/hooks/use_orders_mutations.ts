import { useCallback, useEffect, useState } from "react";

import type {
  Application,
  Address,
  CreateOrderInput,
  Order,
  OrderHistoryActor,
  OrderHistoryEvent,
  OrderReview,
  Provider,
  Specialty,
} from "../types/order_types";
import { OrderStatus } from "../types/order_types";
import { orderService } from "../services/order_service";

const STORAGE_KEY = "maos_a_obra_mock_orders_v6";
const ORDERS_CHANGED_EVENT = "maos-a-obra:orders-changed";

function createHistoryEvent(
  actor: OrderHistoryActor,
  title: string,
  description?: string,
): OrderHistoryEvent {
  return {
    id: `mock-history-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    actor,
    title,
    description,
    createdAt: new Date().toISOString(),
  };
}

function withHistory(
  order: Order,
  actor: OrderHistoryActor,
  title: string,
  description?: string,
) {
  return {
    ...order,
    history: [
      ...(order.history ?? []),
      createHistoryEvent(actor, title, description),
    ],
  };
}

function normalizeScheduledAt(value: string) {
  const scheduledAt = new Date(value);

  if (Number.isNaN(scheduledAt.getTime())) {
    return null;
  }

  return scheduledAt.toISOString();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const PROVIDERS: Provider[] = [
  {
    id: "mock-provider",
    name: "João Prestador",
    bio: "Especialista em reparos residenciais e manutenção preventiva.",
    ratingAverage: 4.8,
    completedServices: 52,
    isSuspended: false,
    specialties: [
      {
        id: "mock-specialty-hidraulica",
        name: "Hidráulica",
        description: "Serviços de encanamento",
        isActive: true,
      },
      {
        id: "mock-specialty-eletrica",
        name: "Elétrica",
        description: "Instalações e reparos elétricos",
        isActive: true,
      },
    ],
  },
  {
    id: "mock-provider-2",
    name: "Ana Reparos",
    bio: "Prestadora com agenda flexível para atendimentos rápidos.",
    ratingAverage: 4.6,
    completedServices: 38,
    isSuspended: false,
    specialties: [
      {
        id: "mock-specialty-hidraulica",
        name: "Hidráulica",
        description: "Serviços de encanamento",
        isActive: true,
      },
    ],
  },
];

const DEFAULT_PROVIDER = PROVIDERS[0];

function resolveProvider(currentProvider?: Provider) {
  return currentProvider ?? DEFAULT_PROVIDER;
}

const now = new Date().toISOString();

const INITIAL_ORDERS: Order[] = [
  {
    id: "1",
    title: "Conserto de torneira",
    description: "Torneira da cozinha está vazando há uma semana.",
    status: OrderStatus.AWAITING_CANDIDATES,
    specialty: {
      id: "mock-specialty-hidraulica",
      name: "Hidráulica",
      description: "Serviços de encanamento",
      isActive: true,
    },
    address: {
      id: "1",
      street: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
    },
    preferredDate: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: now,
    updatedAt: now,
    applications: [],
    history: [
      createHistoryEvent(
        "CLIENT",
        "Ordem criada",
        "A ordem ficou disponível para candidaturas.",
      ),
    ],
  },
  {
    id: "2",
    title: "Instalação de chuveiro",
    description: "Preciso instalar um chuveiro novo no banheiro social.",
    status: OrderStatus.AWAITING_SELECTION,
    specialty: {
      id: "mock-specialty-eletrica",
      name: "Elétrica",
      description: "Instalações e reparos elétricos",
      isActive: true,
    },
    address: {
      id: "2",
      street: "Avenida Principal",
      number: "45",
      neighborhood: "Jardins",
      city: "Aracaju",
      state: "SE",
      zipCode: "49010-000",
    },
    preferredDate: new Date(
      Date.now() + 4 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: now,
    updatedAt: now,
    applications: [
      {
        id: "app-2-1",
        orderId: "2",
        provider: PROVIDERS[0],
        status: "PENDING",
        appliedAt: now,
        respondedAt: now,
      },
    ],
    history: [
      createHistoryEvent("CLIENT", "Ordem criada"),
      createHistoryEvent(
        "PROVIDER",
        "Candidatura recebida",
        `${PROVIDERS[0].name} enviou candidatura.`,
      ),
    ],
  },
  {
    id: "3",
    title: "Troca de sifão",
    description: "Pia do banheiro com vazamento no sifão.",
    status: OrderStatus.AWAITING_CONFIRMATION,
    specialty: {
      id: "mock-specialty-hidraulica",
      name: "Hidráulica",
      description: "Serviços de encanamento",
      isActive: true,
    },
    address: {
      id: "3",
      street: "Rua do Sol",
      number: "80",
      neighborhood: "Farolândia",
      city: "Aracaju",
      state: "SE",
      zipCode: "49030-000",
    },
    selectedProvider: PROVIDERS[0],
    preferredDate: new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    scheduledAt: new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString(),
    startedAt: new Date(
      Date.now() - 8 * 60 * 60 * 1000,
    ).toISOString(),
    finishedAt: new Date(
      Date.now() - 2 * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: now,
    updatedAt: now,
    applications: [
      {
        id: "app-3-1",
        orderId: "3",
        provider: PROVIDERS[0],
        status: "ACCEPTED",
        appliedAt: now,
        respondedAt: now,
      },
    ],
    history: [
      createHistoryEvent("CLIENT", "Ordem criada"),
      createHistoryEvent("CLIENT", "Prestador selecionado"),
      createHistoryEvent("CLIENT", "Agendamento confirmado"),
      createHistoryEvent("PROVIDER", "Serviço iniciado"),
      createHistoryEvent(
        "PROVIDER",
        "Serviço encerrado",
        "Aguardando confirmação do cliente.",
      ),
    ],
  },
];

function readOrders() {
  const storedOrders = localStorage.getItem(STORAGE_KEY);

  if (!storedOrders) {
    return INITIAL_ORDERS;
  }

  try {
    return JSON.parse(storedOrders) as Order[];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return INITIAL_ORDERS;
  }
}

function persistOrders(orders: Order[], notify = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  if (notify) {
    window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
  }
}

export function upsertStoredOrders(nextOrders: Order | Order[], notify = false) {
  const ordersToUpsert = Array.isArray(nextOrders) ? nextOrders : [nextOrders];
  const storedOrders = readOrders();
  const mergedOrders = [
    ...ordersToUpsert,
    ...storedOrders.filter(
      (storedOrder) =>
        !ordersToUpsert.some((order) => order.id === storedOrder.id),
    ),
  ];

  persistOrders(mergedOrders, notify);
  return mergedOrders;
}

export function createMockOrder(
  input: CreateOrderInput,
  specialty: Specialty,
  address: Address,
) {
  const orders = readOrders();
  const createdAt = new Date().toISOString();
  const order: Order = {
    id: `mock-order-${Date.now()}`,
    title: input.title,
    description: input.description,
    status: OrderStatus.AWAITING_CANDIDATES,
    specialty,
    address,
    preferredDate: new Date(input.preferredDate).toISOString(),
    createdAt,
    updatedAt: createdAt,
    applications: [],
    history: [
      createHistoryEvent(
        "CLIENT",
        "Ordem criada",
        "A ordem ficou disponível para candidaturas.",
      ),
    ],
  };

  persistOrders([order, ...orders]);
  return order;
}

type OrderSource = "client" | "provider" | "admin" | "mock";

export function useOrdersMutations(
  currentProvider?: Provider,
  source: OrderSource = "mock",
) {
  const [orders, setOrders] = useState<Order[]>(readOrders);
  const activeProvider = resolveProvider(currentProvider);

  const syncApiOrders = useCallback(async () => {
    if (source === "mock") {
      return;
    }

    try {
      const apiOrders =
        source === "admin"
          ? await orderService.listAdminOrders()
          : source === "provider"
          ? await orderService.listProviderOrders()
          : await orderService.listOrders();

      setOrders(apiOrders);
      upsertStoredOrders(apiOrders);
    } catch {
      setOrders(readOrders());
    }
  }, [source]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void syncApiOrders();
    }, 0);
    const handleOrdersChanged = () => {
      setOrders(readOrders());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setOrders(readOrders());
      }
    };

    window.addEventListener(ORDERS_CHANGED_EVENT, handleOrdersChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(ORDERS_CHANGED_EVENT, handleOrdersChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncApiOrders]);

  function updateOrders(
    updater: (currentOrders: Order[]) => Order[],
  ) {
    setOrders((currentOrders) => {
      const nextOrders = updater(currentOrders);
      persistOrders(nextOrders);
      return nextOrders;
    });
  }

  async function applyForOrder(orderId: string) {
    if (source === "provider") {
      try {
        await orderService.applyForOrder(orderId);
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    updateOrders((currentOrders) =>
      currentOrders.map((order) => {
        const canReceiveApplications =
          order.status === OrderStatus.CREATED ||
          order.status === OrderStatus.AWAITING_CANDIDATES ||
          order.status === OrderStatus.AWAITING_SELECTION;

        if (order.id !== orderId || order.selectedProvider || !canReceiveApplications) {
          return order;
        }

        const alreadyApplied = order.applications?.some(
          (application) => application.provider.id === activeProvider.id,
        );

        if (alreadyApplied) {
          return order;
        }

        const application: Application = {
          id: `app-${order.id}-${Date.now()}`,
          orderId: order.id,
          provider: activeProvider,
          status: "PENDING",
          appliedAt: new Date().toISOString(),
        };

        return withHistory(
          {
          ...order,
          status: OrderStatus.AWAITING_SELECTION,
          applications: [...(order.applications ?? []), application],
          updatedAt: new Date().toISOString(),
          },
          "PROVIDER",
          "Candidatura enviada",
          `${activeProvider.name} demonstrou interesse na ordem.`,
        );
      }),
    );
  }

  async function acceptApplication(orderId: string, applicationId: string) {
    if (source === "client") {
      try {
        await orderService.acceptApplication(orderId, applicationId);
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    updateOrders((currentOrders) =>
      currentOrders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        const acceptedApplication = order.applications?.find(
          (application) => application.id === applicationId,
        );

        if (!acceptedApplication) {
          return order;
        }

        return withHistory(
          {
          ...order,
          status: OrderStatus.PROVIDER_SELECTED,
          selectedProvider: acceptedApplication.provider,
          applications: order.applications?.map((application) => ({
            ...application,
            status:
              application.id === applicationId ? "ACCEPTED" : "REJECTED",
            respondedAt: new Date().toISOString(),
          })),
          updatedAt: new Date().toISOString(),
          },
          "CLIENT",
          "Prestador selecionado",
          `${acceptedApplication.provider.name} foi aceito para a ordem.`,
        );
      }),
    );
  }

  async function rejectApplication(orderId: string, applicationId: string) {
    if (source === "client") {
      try {
        await orderService.rejectApplication(orderId, applicationId);
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    updateOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              applications: order.applications?.map((application) =>
                application.id === applicationId
                  ? {
                      ...application,
                      status: "REJECTED",
                      respondedAt: new Date().toISOString(),
                    }
                  : application,
              ),
              updatedAt: new Date().toISOString(),
              history: [
                ...(order.history ?? []),
                createHistoryEvent(
                  "CLIENT",
                  "Candidatura recusada",
                  "O prestador foi removido da seleção.",
                ),
              ],
            }
          : order,
      ),
    );
  }

  function cancelApplication(orderId: string, applicationId: string) {
    updateOrders((currentOrders) =>
      currentOrders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        const nextApplications = order.applications?.filter(
          (application) => application.id !== applicationId,
        );
        const activeApplications =
          nextApplications?.filter(
            (application) => application.status === "PENDING",
          ) ?? [];

        return withHistory(
          {
          ...order,
          status:
            activeApplications.length === 0 && !order.selectedProvider
              ? OrderStatus.AWAITING_CANDIDATES
              : order.status,
          applications: nextApplications,
          updatedAt: new Date().toISOString(),
          },
          "PROVIDER",
          "Candidatura cancelada",
          "O prestador retirou a própria candidatura.",
        );
      }),
    );
  }

  async function scheduleOrder(orderId: string, scheduledAtValue?: string) {
    if (source === "client" && scheduledAtValue) {
      try {
        const scheduledOrder = await orderService.scheduleOrder(
          orderId,
          scheduledAtValue,
        );
        upsertStoredOrders(scheduledOrder);
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    updateOrders((currentOrders) =>
      currentOrders.map((order) => {
        if (
          order.id !== orderId ||
          order.status !== OrderStatus.PROVIDER_SELECTED
        ) {
          return order;
        }

        const scheduledAt = normalizeScheduledAt(
          scheduledAtValue ?? order.preferredDate,
        );

        if (!scheduledAt) {
          return order;
        }

        return withHistory(
          {
            ...order,
            status: OrderStatus.SCHEDULED,
            scheduledAt,
            updatedAt: new Date().toISOString(),
          },
          "CLIENT",
          "Agendamento confirmado",
          `Horário oficial registrado para ${formatDateTime(scheduledAt)}.`,
        );
      }),
    );
  }

  async function startOrder(orderId: string) {
    if (source === "provider") {
      try {
        const startedOrder = await orderService.startOrder(orderId);
        upsertStoredOrders(startedOrder);
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    updateOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId && order.status === OrderStatus.SCHEDULED
          ? withHistory(
              {
              ...order,
              status: OrderStatus.IN_PROGRESS,
              startedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              },
              "PROVIDER",
              "Serviço iniciado",
            )
          : order,
      ),
    );
  }

  async function finishOrder(orderId: string) {
    if (source === "provider") {
      try {
        const finishedOrder = await orderService.finishOrder(orderId);
        upsertStoredOrders(finishedOrder);
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    updateOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId && order.status === OrderStatus.IN_PROGRESS
          ? withHistory(
              {
              ...order,
              status: OrderStatus.AWAITING_CONFIRMATION,
              finishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              },
              "PROVIDER",
              "Serviço encerrado",
              "Aguardando confirmação do cliente.",
            )
          : order,
      ),
    );
  }

  async function confirmFinished(orderId: string, review?: OrderReview) {
    if (source === "client") {
      try {
        const confirmedOrder = await orderService.confirmOrder(orderId);

        if (review) {
          await orderService.createReview(orderId, {
            rating: review.rating,
            comment: review.comment,
          });
        }

        upsertStoredOrders({
          ...confirmedOrder,
          review: review ?? confirmedOrder.review,
        });
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    updateOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId &&
        order.status === OrderStatus.AWAITING_CONFIRMATION
          ? withHistory(
              {
              ...order,
              status: OrderStatus.FINISHED,
              review,
              payment: {
                id: `mock-payment-${order.id}-${Date.now()}`,
                status: "APPROVED",
                amount: 180,
                createdAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
              },
              "CLIENT",
              "Serviço confirmado e avaliado",
              "Pagamento mockado liberado para o prestador.",
            )
          : order,
      ),
    );
  }

  async function cancelOrder(
    orderId: string,
    reason = "Cancelamento solicitado.",
    actor: OrderHistoryActor = "CLIENT",
  ) {
    if (source === "admin") {
      try {
        const cancelledOrder = await orderService.cancelOrderAsAdmin(
          orderId,
          reason,
        );
        upsertStoredOrders(cancelledOrder);
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    if (source === "client" || source === "provider") {
      try {
        const cancelledOrder = await orderService.cancelOrder(orderId);
        upsertStoredOrders(cancelledOrder);
        await syncApiOrders();
        return;
      } catch {
        // Keep MVP usable with mock data when API is unavailable.
      }
    }

    updateOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? withHistory(
              {
              ...order,
              status: OrderStatus.CANCELLED,
              updatedAt: new Date().toISOString(),
              },
              actor,
              "Ordem cancelada",
              reason,
            )
          : order,
      ),
    );
  }

  function expireOrder(orderId: string) {
    updateOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId &&
        [
          OrderStatus.CREATED,
          OrderStatus.AWAITING_CANDIDATES,
          OrderStatus.AWAITING_SELECTION,
        ].includes(order.status)
          ? withHistory(
              {
              ...order,
              status: OrderStatus.EXPIRED,
              updatedAt: new Date().toISOString(),
              },
              "ADMIN",
              "Ordem expirada",
              "Prazo de candidatura encerrado sem seleção.",
            )
          : order,
      ),
    );
  }

  const refreshOrderById = useCallback(async (orderId: string) => {
    if (source === "mock") {
      return readOrders().find((order) => order.id === orderId) ?? null;
    }

    try {
      const apiOrder = await orderService.getOrderById(orderId);
      setOrders((currentOrders) => {
        const nextOrders = [
          apiOrder,
          ...currentOrders.filter((order) => order.id !== orderId),
        ];
        persistOrders(nextOrders);
        return nextOrders;
      });
      upsertStoredOrders(apiOrder);
      return apiOrder;
    } catch {
      return readOrders().find((order) => order.id === orderId) ?? null;
    }
  }, [source]);

  function getOrderById(orderId: string) {
    return orders.find((order) => order.id === orderId) ?? null;
  }

  return {
    orders,
    loading: false,
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
