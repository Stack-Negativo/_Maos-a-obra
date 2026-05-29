import type { Specialty } from "@/features/specialties/types/specialty_types";
import { providerApi } from "@/api/providers";
import type { ProviderApiResponse } from "@/api/providers";
import axios from "axios";

import type { ProviderPayload, ProviderProfile } from "../types/provider_types";

export const PROVIDERS_CHANGED_EVENT = "maos-a-obra:providers-changed";

export function notifyProvidersChanged() {
  window.dispatchEvent(new Event(PROVIDERS_CHANGED_EVENT));
}

function mapApiProvider(provider: ProviderApiResponse): ProviderProfile {
  return {
    id: provider.id,
    userId: provider.user_id,
    name: provider.user?.full_name ?? provider.user_id,
    bio: provider.bio ?? "",
    specialties: provider.specialties.map((item) => ({
      id: item.specialty.id,
      name: item.specialty.name,
      description: item.specialty.description ?? "",
      isActive: item.specialty.is_active,
    })),
    ratingAverage: provider.rating_average ?? 0,
    completedServices: provider.total_reviews ?? 0,
    isSuspended: provider.is_suspended ?? false,
  };
}

function isAdminSession() {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return false;
    }

    const user = JSON.parse(storedUser) as { role?: string; isAdmin?: boolean };
    return user.role === "ADMIN" || user.isAdmin === true;
  } catch {
    return false;
  }
}

export async function listProviders(): Promise<ProviderProfile[]> {
  const response = isAdminSession()
    ? await providerApi.listAdmin()
    : await providerApi.list();

  if (!response.success) {
    throw new Error(response.error?.message ?? "Falha ao carregar prestadores");
  }

  return response.data.map(mapApiProvider);
}

export async function createProviderProfile(
  payload: ProviderPayload,
): Promise<ProviderProfile> {
  const response = await providerApi.register({
    bio: payload.bio,
    specialty_ids: payload.specialties.map((specialty) => specialty.id),
  });

  if (!response.success) {
    throw new Error(response.error?.message ?? "Falha ao cadastrar prestador");
  }

  notifyProvidersChanged();
  return mapApiProvider(response.data);
}

export function upsertMockProviderProfile(input: {
  id?: string;
  userId?: string;
  name: string;
  bio: string;
  specialties: Specialty[];
}) {
  return {
    id: input.id ?? input.userId ?? "",
    userId: input.userId,
    name: input.name,
    bio: input.bio,
    specialties: input.specialties,
    ratingAverage: 0,
    completedServices: 0,
    isSuspended: false,
  };
}

export async function suspendProvider(providerId: string) {
  const response = await providerApi.suspend(providerId);

  if (!response.success) {
    throw new Error(response.error?.message ?? "Falha ao suspender prestador");
  }

  notifyProvidersChanged();
  return mapApiProvider(response.data);
}

export async function unsuspendProvider(providerId: string) {
  const response = await providerApi.unsuspend(providerId);

  if (!response.success) {
    throw new Error(response.error?.message ?? "Falha ao reativar prestador");
  }

  notifyProvidersChanged();
  return mapApiProvider(response.data);
}

export async function deleteProvider(providerId: string) {
  try {
    await providerApi.delete(providerId);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | {
            detail?: string;
            error?: {
              message?: string;
            };
          }
        | undefined;

      throw Object.assign(
        new Error(
          data?.error?.message ??
            data?.detail ??
            "Falha ao excluir prestador",
        ),
        { cause: error },
      );
    }

    throw error;
  }

  notifyProvidersChanged();
}
