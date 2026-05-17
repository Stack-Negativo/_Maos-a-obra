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
};
