import type { AxiosRequestConfig } from "axios";

import httpClient from "./http-client";
import type { ApiResponse } from "./auth";

export type ProviderUserApiResponse = {
  id: string;
  full_name: string;
  email: string;
};

export type ProviderSpecialtyApiResponse = {
  specialty: {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
  };
  linked_at: string;
};

export type ProviderApiResponse = {
  id: string;
  user_id: string;
  user: ProviderUserApiResponse;
  bio?: string;
  rating_average: number;
  total_reviews: number;
  is_suspended: boolean;
  suspended_at?: string;
  created_at: string;
  updated_at: string;
  specialties: ProviderSpecialtyApiResponse[];
};

export const providerApi = {
  me: async (
    token?: string,
  ): Promise<ApiResponse<ProviderApiResponse>> => {
    const config: AxiosRequestConfig = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};

    const response = await httpClient.get<
      ApiResponse<ProviderApiResponse>
    >("/providers/me", config);

    return response.data;
  },

  list: async (): Promise<ApiResponse<ProviderApiResponse[]>> => {
    const response = await httpClient.get<
      ApiResponse<ProviderApiResponse[]>
    >("/providers/");

    return response.data;
  },

  listAdmin: async (): Promise<ApiResponse<ProviderApiResponse[]>> => {
    const response = await httpClient.get<
      ApiResponse<ProviderApiResponse[]>
    >("/admin/providers");

    return response.data;
  },

  listSuspended: async (): Promise<ApiResponse<ProviderApiResponse[]>> => {
    const response = await httpClient.get<
      ApiResponse<ProviderApiResponse[]>
    >("/admin/providers/suspended");

    return response.data;
  },

  register: async (
    payload: {
      bio: string;
      specialty_ids: string[];
    },
  ): Promise<ApiResponse<ProviderApiResponse>> => {
    const response = await httpClient.post<
      ApiResponse<ProviderApiResponse>
    >("/providers/", payload);

    return response.data;
  },

  suspend: async (
    providerId: string,
  ): Promise<ApiResponse<ProviderApiResponse>> => {
    const response = await httpClient.post<
      ApiResponse<ProviderApiResponse>
    >(`/admin/providers/${providerId}/suspend`);

    return response.data;
  },

  unsuspend: async (
    providerId: string,
  ): Promise<ApiResponse<ProviderApiResponse>> => {
    const response = await httpClient.post<
      ApiResponse<ProviderApiResponse>
    >(`/admin/providers/${providerId}/unsuspend`);

    return response.data;
  },

  delete: async (providerId: string): Promise<void> => {
    await httpClient.delete(`/admin/providers/${providerId}`);
  },
};
