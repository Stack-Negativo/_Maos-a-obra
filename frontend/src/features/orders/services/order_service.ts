import httpClient from "@/api/http-client";
import type {
  Order,
  CreateOrderInput,
  Application,
} from "../types/order_types";

const BASE_URL = "/api/v1/orders";

export const orderService = {
  async listOrders(): Promise<Order[]> {
    const { data } = await httpClient.get<Order[]>(`${BASE_URL}`);
    return data;
  },

  async getOrderById(id: number): Promise<Order> {
    const { data } = await httpClient.get<Order>(`${BASE_URL}/${id}`);
    return data;
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const { data } = await httpClient.post<Order>(
      `${BASE_URL}`,
      input,
    );
    return data;
  },

  async updateOrder(
    id: number,
    updates: Partial<Order>,
  ): Promise<Order> {
    const { data } = await httpClient.put<Order>(
      `${BASE_URL}/${id}`,
      updates,
    );
    return data;
  },

  async cancelOrder(id: number): Promise<Order> {
    const { data } = await httpClient.post<Order>(
      `${BASE_URL}/${id}/cancel`,
    );
    return data;
  },

  async getApplications(orderId: number): Promise<Application[]> {
    const { data } = await httpClient.get<Application[]>(
      `${BASE_URL}/${orderId}/applications`,
    );
    return data;
  },

  async acceptApplication(
    orderId: number,
    applicationId: number,
  ): Promise<Order> {
    const { data } = await httpClient.post<Order>(
      `${BASE_URL}/${orderId}/applications/${applicationId}/accept`,
    );
    return data;
  },

  async rejectApplication(
    orderId: number,
    applicationId: number,
  ): Promise<Order> {
    const { data } = await httpClient.post<Order>(
      `${BASE_URL}/${orderId}/applications/${applicationId}/reject`,
    );
    return data;
  },
};
