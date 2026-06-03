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
  password: string;
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
  email: string;
  full_name: string;
  phone?: string;
  nome?: string;
  role?: string;
  is_provider?: boolean;
  is_admin?: boolean;
};

export type UpdateMeApiPayload = {
  full_name: string;
  phone: string;
};

export const authApi = {
  register: async (
    payload: RegisterApiPayload,
  ): Promise<ApiResponse<LoginApiResponse>> => {
    const requestBody = {
      full_name: payload.nome,
      email: payload.email,
      password: payload.senha,
      phone: payload.telefone,
    };

    const response = await httpClient.post<
      ApiResponse<LoginApiResponse>
    >("/auth/register", requestBody);

    return response.data;
  },

  login: async (
    payload: LoginApiPayload,
  ): Promise<ApiResponse<LoginApiResponse>> => {
    const formData = new URLSearchParams();
    formData.append("username", payload.email);
    formData.append("password", payload.password);

    const response = await httpClient.post<
      ApiResponse<LoginApiResponse>
    >("/auth/token", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

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

  updateMe: async (
    payload: UpdateMeApiPayload,
  ): Promise<ApiResponse<UserApiResponse>> => {
    const response = await httpClient.patch<
      ApiResponse<UserApiResponse>
    >("/auth/me", payload);

    return response.data;
  },
};
