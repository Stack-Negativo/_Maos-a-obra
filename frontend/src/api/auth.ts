import type { AxiosRequestConfig } from "axios";

import httpClient from "./http-client";

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
};

export type LoginApiPayload = {
  email: string;
  senha: string;
};

export type LoginApiResponse = {
  access_token: string;
  token_type: string;
};

export type RegisterApiPayload = {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
};

export type UserApiResponse = {
  id: string;
  nome: string;
  email: string;
};

export const authApi = {
  register: async (
    payload: RegisterApiPayload,
  ): Promise<ApiResponse<UserApiResponse>> => {
    const response = await httpClient.post<
      ApiResponse<UserApiResponse>
    >("/auth/register", payload);

    return response.data;
  },

  login: async (
    payload: LoginApiPayload,
  ): Promise<ApiResponse<LoginApiResponse>> => {
    const response = await httpClient.post<
      ApiResponse<LoginApiResponse>
    >("/auth/login", payload);

    return response.data;
  },

  me: async (
    token?: string,
  ): Promise<ApiResponse<UserApiResponse>> => {
    const config: AxiosRequestConfig = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};

    const response = await httpClient.get<
      ApiResponse<UserApiResponse>
    >("/auth/me", config);

    return response.data;
  },
};
