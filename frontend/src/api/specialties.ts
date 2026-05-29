import type { ApiResponse as BaseApiResponse } from "./auth";

import httpClient from "./http-client";

export type SpecialtyApiResponse = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
};

export const specialtiesApi = {
  getAll: async () => {
    const response = await httpClient.get<
      BaseApiResponse<SpecialtyApiResponse[]>
    >("/specialties");

    return response.data;
  },

  create: async (payload: {
    name: string;
    description: string;
    is_active: boolean;
  }) => {
    const response = await httpClient.post<
      BaseApiResponse<SpecialtyApiResponse>
    >("/specialties/", payload);

    return response.data;
  },

  update: async (
    specialtyId: string,
    payload: Partial<{
      name: string;
      description: string;
      is_active: boolean;
    }>,
  ) => {
    const response = await httpClient.patch<
      BaseApiResponse<SpecialtyApiResponse>
    >(`/specialties/${specialtyId}`, payload);

    return response.data;
  },
};
