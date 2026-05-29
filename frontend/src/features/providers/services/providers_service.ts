import axios from "axios";

import type { Specialty } from "@/features/specialties/types/specialty_types";
import { providerApi } from "@/api/providers";
import type { ProviderApiResponse } from "@/api/providers";

import type {
  ProviderPayload,
  ProviderProfile,
} from "../types/provider_types";

const MOCK_PROVIDERS_STORAGE_KEY =
  "mock_providers";
export const PROVIDERS_CHANGED_EVENT = "maos-a-obra:providers-changed";

const DEFAULT_SPECIALTIES: Specialty[] = [
  {
    id: "mock-specialty-eletrica",
    name: "Elétrica",
    description: "Troca de chuveiro, tomadas, disjuntores e instalações simples.",
    isActive: true,
  },
  {
    id: "mock-specialty-hidraulica",
    name: "Hidráulica",
    description: "Reparos em vazamentos, torneiras, descargas e encanamentos.",
    isActive: true,
  },
  {
    id: "mock-specialty-pintura",
    name: "Pintura",
    description: "Pintura residencial, retoques e preparação de paredes.",
    isActive: true,
  },
];

const DEFAULT_PROVIDERS: ProviderProfile[] = [
  {
    id: "mock-provider-joao",
    name: "João Eletricista",
    bio: "Atendimento residencial para instalações, tomadas e pequenos reparos elétricos.",
    specialties: [DEFAULT_SPECIALTIES[0]],
    ratingAverage: 4.8,
    completedServices: 47,
    isSuspended: false,
  },
  {
    id: "mock-provider-carla",
    name: "Carla Hidráulica",
    bio: "Foco em vazamentos, torneiras, descargas e manutenção preventiva.",
    specialties: [DEFAULT_SPECIALTIES[1]],
    ratingAverage: 4.6,
    completedServices: 31,
    isSuspended: false,
  },
  {
    id: "mock-provider-marcos",
    name: "Marcos Pinturas",
    bio: "Pintura interna, acabamento fino e reparos em paredes.",
    specialties: [DEFAULT_SPECIALTIES[2]],
    ratingAverage: 2.8,
    completedServices: 13,
    isSuspended: true,
  },
];

function readProviders(): ProviderProfile[] {
  const storedProviders =
    localStorage.getItem(MOCK_PROVIDERS_STORAGE_KEY);

  if (!storedProviders) {
    return DEFAULT_PROVIDERS;
  }

  try {
    return JSON.parse(storedProviders) as ProviderProfile[];
  } catch {
    localStorage.removeItem(
      MOCK_PROVIDERS_STORAGE_KEY,
    );

    return DEFAULT_PROVIDERS;
  }
}

function saveProviders(providers: ProviderProfile[]) {
  localStorage.setItem(
    MOCK_PROVIDERS_STORAGE_KEY,
    JSON.stringify(providers),
  );
  notifyProvidersChanged();
}

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

function isNetworkError(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    !error.response
  );
}

function isMockSession() {
  return localStorage.getItem("token") === "mock-token-mvp";
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
  if (isMockSession()) {
    return readProviders();
  }

  try {
    const response = isAdminSession()
      ? await providerApi.listAdmin()
      : await providerApi.list();
    if (!response.success) {
      throw new Error(response.error?.message ?? "Falha ao carregar prestadores");
    }

    return response.data.map(mapApiProvider);
  } catch (error) {
    if (isNetworkError(error)) {
      return readProviders();
    }

    throw error;
  }
}

export async function createProviderProfile(
  payload: ProviderPayload,
): Promise<ProviderProfile> {
  if (isMockSession()) {
    const provider: ProviderProfile = {
      id: `mock-provider-${Date.now()}`,
      name: payload.name,
      bio: payload.bio,
      specialties: payload.specialties,
      ratingAverage: 0,
      completedServices: 0,
      isSuspended: false,
    };

    const providers = [provider, ...readProviders()];
    saveProviders(providers);
    return provider;
  }

  try {
    const response = await providerApi.register({
      bio: payload.bio,
      specialty_ids: payload.specialties.map((specialty) => specialty.id),
    });

    if (!response.success) {
      throw new Error(response.error?.message ?? "Falha ao cadastrar prestador");
    }

    return mapApiProvider(response.data);
  } catch (error) {
    if (isNetworkError(error)) {
      const provider: ProviderProfile = {
        id: `mock-provider-${Date.now()}`,
        name: payload.name,
        bio: payload.bio,
        specialties: payload.specialties,
        ratingAverage: 0,
        completedServices: 0,
        isSuspended: false,
      };

      const providers = [
        provider,
        ...readProviders(),
      ];

      saveProviders(providers);
      return provider;
    }

    throw error;
  }
}

export function upsertMockProviderProfile(input: {
  id?: string;
  userId?: string;
  name: string;
  bio: string;
  specialties: Specialty[];
}) {
  const provider: ProviderProfile = {
    id: input.id ?? `mock-provider-${Date.now()}`,
    userId: input.userId,
    name: input.name,
    bio: input.bio,
    specialties: input.specialties,
    ratingAverage: 0,
    completedServices: 0,
    isSuspended: false,
  };
  const providers = readProviders();
  const existingIndex = providers.findIndex(
    (currentProvider) =>
      (input.userId && currentProvider.userId === input.userId) ||
      currentProvider.id === provider.id,
  );
  const nextProviders =
    existingIndex >= 0
      ? providers.map((currentProvider, index) =>
          index === existingIndex
            ? {
                ...currentProvider,
                ...provider,
                ratingAverage: currentProvider.ratingAverage,
                completedServices: currentProvider.completedServices,
                isSuspended: currentProvider.isSuspended,
              }
            : currentProvider,
        )
      : [provider, ...providers];

  saveProviders(nextProviders);
  return provider;
}

function updateMockProviderSuspension(providerId: string, isSuspended: boolean) {
  const providers = readProviders();
  const provider = providers.find((currentProvider) => currentProvider.id === providerId);

  if (!provider) {
    throw new Error("Prestador não encontrado.");
  }

  const nextProviders = providers.map((currentProvider) =>
    currentProvider.id === providerId
      ? {
          ...currentProvider,
          isSuspended,
        }
      : currentProvider,
  );

  saveProviders(nextProviders);

  return {
    ...provider,
    isSuspended,
  };
}

export async function suspendProvider(providerId: string) {
  if (!isMockSession()) {
    try {
      const response = await providerApi.suspend(providerId);

      if (!response.success) {
        throw new Error(response.error?.message ?? "Falha ao suspender prestador");
      }

      notifyProvidersChanged();
      return mapApiProvider(response.data);
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  return updateMockProviderSuspension(providerId, true);
}

export async function unsuspendProvider(providerId: string) {
  if (!isMockSession()) {
    try {
      const response = await providerApi.unsuspend(providerId);

      if (!response.success) {
        throw new Error(response.error?.message ?? "Falha ao reativar prestador");
      }

      notifyProvidersChanged();
      return mapApiProvider(response.data);
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  return updateMockProviderSuspension(providerId, false);
}
