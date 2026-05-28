export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Address {
  id: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Provider {
  id: string;
  name: string;
  bio?: string;
  ratingAverage: number;
  completedServices: number;
  isSuspended: boolean;
  specialties: Specialty[];
}

export enum OrderStatus {
  CREATED = "CREATED",
  AWAITING_CANDIDATES = "AWAITING_CANDIDATES",
  AWAITING_SELECTION = "AWAITING_SELECTION",
  PROVIDER_SELECTED = "PROVIDER_SELECTED",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface Order {
  id: string;
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
  applications?: Application[];
  review?: OrderReview;
  payment?: OrderPayment;
  history?: OrderHistoryEvent[];
}

export interface Application {
  id: string;
  orderId: string;
  provider: Provider;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
  respondedAt?: string;
}

export interface OrderReview {
  rating: number;
  comment?: string;
  reviewedAt: string;
}

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "APPROVED"
  | "REJECTED"
  | "REFUNDED";

export interface OrderPayment {
  id: string;
  status: PaymentStatus;
  amount: number;
  processedAt?: string;
  createdAt: string;
}

export type OrderHistoryActor = "CLIENT" | "PROVIDER" | "ADMIN" | "SYSTEM";

export interface OrderHistoryEvent {
  id: string;
  actor: OrderHistoryActor;
  title: string;
  description?: string;
  createdAt: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  REFUNDED: "Estornado",
};

export interface CreateOrderInput {
  title: string;
  description: string;
  specialtyId: string;
  addressId: string;
  preferredDate: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "Criada",
  [OrderStatus.AWAITING_CANDIDATES]: "Aberta para candidaturas",
  [OrderStatus.AWAITING_SELECTION]: "Aguardando escolha",
  [OrderStatus.PROVIDER_SELECTED]: "Prestador selecionado",
  [OrderStatus.SCHEDULED]: "Agendada",
  [OrderStatus.IN_PROGRESS]: "Em andamento",
  [OrderStatus.AWAITING_CONFIRMATION]: "Aguardando confirmação",
  [OrderStatus.FINISHED]: "Finalizada",
  [OrderStatus.CANCELLED]: "Cancelada",
  [OrderStatus.EXPIRED]: "Expirada",
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  "success" | "warning" | "info" | "danger"
> = {
  [OrderStatus.CREATED]: "info",
  [OrderStatus.AWAITING_CANDIDATES]: "info",
  [OrderStatus.AWAITING_SELECTION]: "warning",
  [OrderStatus.PROVIDER_SELECTED]: "info",
  [OrderStatus.SCHEDULED]: "warning",
  [OrderStatus.IN_PROGRESS]: "warning",
  [OrderStatus.AWAITING_CONFIRMATION]: "warning",
  [OrderStatus.FINISHED]: "success",
  [OrderStatus.CANCELLED]: "danger",
  [OrderStatus.EXPIRED]: "danger",
};
