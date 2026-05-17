export interface Specialty {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Address {
  id: number;
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface Provider {
  id: number;
  name: string;
  bio?: string;
  ratingAverage: number;
  completedServices: number;
  isSuspended: boolean;
  specialties: Specialty[];
}

export enum OrderStatus {
  CREATED = "CREATED",
  PROVIDER_SELECTED = "PROVIDER_SELECTED",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export interface Order {
  id: number;
  title: string;
  description: string;
  status: OrderStatus;
  specialty: Specialty;
  address: Address;
  selectedProvider?: Provider;
  preferredDate: string;
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: number;
  orderId: number;
  provider: Provider;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
  respondedAt?: string;
}

export interface CreateOrderInput {
  title: string;
  description: string;
  specialtyId: number;
  addressId: number;
  preferredDate: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "Criada",
  [OrderStatus.PROVIDER_SELECTED]: "Prestador Selecionado",
  [OrderStatus.SCHEDULED]: "Agendada",
  [OrderStatus.IN_PROGRESS]: "Em Andamento",
  [OrderStatus.AWAITING_CONFIRMATION]: "Aguardando Confirmação",
  [OrderStatus.FINISHED]: "Finalizada",
  [OrderStatus.CANCELLED]: "Cancelada",
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  "success" | "warning" | "info" | "danger"
> = {
  [OrderStatus.CREATED]: "info",
  [OrderStatus.PROVIDER_SELECTED]: "info",
  [OrderStatus.SCHEDULED]: "warning",
  [OrderStatus.IN_PROGRESS]: "warning",
  [OrderStatus.AWAITING_CONFIRMATION]: "warning",
  [OrderStatus.FINISHED]: "success",
  [OrderStatus.CANCELLED]: "danger",
};
