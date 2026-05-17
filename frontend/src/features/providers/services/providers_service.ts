import type { Specialty } from "@/features/specialties/types/specialty_types";

import type {
  ProviderPayload,
  ProviderProfile,
} from "../types/provider_types";

const MOCK_PROVIDERS_STORAGE_KEY =
  "mock_providers";

const DEFAULT_SPECIALTIES: Specialty[] = [
  {
    id: "mock-specialty-eletrica",
    name: "Eletrica",
    description: "Troca de chuveiro, tomadas, disjuntores e instalacoes simples.",
    isActive: true,
  },
  {
    id: "mock-specialty-hidraulica",
    name: "Hidraulica",
    description: "Reparos em vazamentos, torneiras, descargas e encanamentos.",
    isActive: true,
  },
  {
    id: "mock-specialty-pintura",
    name: "Pintura",
    description: "Pintura residencial, retoques e preparacao de paredes.",
    isActive: true,
  },
];

const DEFAULT_PROVIDERS: ProviderProfile[] = [
  {
    id: "mock-provider-joao",
    name: "Joao Eletricista",
    bio: "Atendimento residencial para instalacoes, tomadas e pequenos reparos eletricos.",
    specialties: [DEFAULT_SPECIALTIES[0]],
    ratingAverage: 4.8,
    completedServices: 47,
    isSuspended: false,
  },
  {
    id: "mock-provider-carla",
    name: "Carla Hidraulica",
    bio: "Foco em vazamentos, torneiras, descargas e manutencao preventiva.",
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
}

export async function listProviders(): Promise<ProviderProfile[]> {
  return readProviders();
}

export async function createProviderProfile(
  payload: ProviderPayload,
): Promise<ProviderProfile> {
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
