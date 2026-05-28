import axios from "axios";

import { authApi } from "@/api/auth";
import { providerApi } from "@/api/providers";
import { listSpecialties } from "@/features/specialties/services/specialties_service";
import {
  notifyProvidersChanged,
  upsertMockProviderProfile,
} from "@/features/providers/services/providers_service";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types";
import { UserRole } from "../types/auth_types";

type MockUser = User;

export const MOCK_PROVIDER_SPECIALTIES = [
  {
    id: "mock-specialty-hidraulica",
    name: "Hidráulica",
    description: "Serviços de encanamento",
    isActive: true,
  },
  {
    id: "mock-specialty-eletrica",
    name: "Elétrica",
    description: "Instalações e reparos elétricos",
    isActive: true,
  },
  {
    id: "mock-specialty-pintura",
    name: "Pintura",
    description: "Pintura e acabamento residencial",
    isActive: true,
  },
];

const MOCK_USER_STORAGE_KEY = "mock_user";

const MOCK_USERS: Record<string, MockUser> = {
  "cliente@maosaobra.local": {
    id: "mock-client",
    name: "Mariana Cliente",
    email: "cliente@maosaobra.local",
    role: UserRole.CLIENT,
    isProvider: false,
    isAdmin: false,
    specialties: [],
  },
  "prestador@maosaobra.local": {
    id: "mock-provider",
    name: "João Prestador",
    email: "prestador@maosaobra.local",
    role: UserRole.PROVIDER,
    bio: "Especialista em reparos residenciais e manutenção preventiva.",
    isProvider: true,
    isAdmin: false,
    specialties: MOCK_PROVIDER_SPECIALTIES.slice(0, 2),
  },
  "admin@maosaobra.local": {
    id: "mock-admin",
    name: "Admin Sistema",
    email: "admin@maosaobra.local",
    role: UserRole.ADMIN,
    isProvider: false,
    isAdmin: true,
    specialties: [],
  },
};

function isNetworkError(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}

function isRealAdminEmail(email: string) {
  return email.trim().toLowerCase() === "admin@maosaobra.com.br";
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          detail?: string;
          error?: {
            message?: string;
          };
        }
      | undefined;

    return data?.error?.message ?? data?.detail ?? error.message;
  }

  return error instanceof Error ? error.message : null;
}

function getSpecialtiesById(ids?: string[]) {
  const selectedIds = ids?.length
    ? ids
    : [MOCK_PROVIDER_SPECIALTIES[0].id];

  return MOCK_PROVIDER_SPECIALTIES.filter((specialty) =>
    selectedIds.includes(specialty.id),
  );
}

async function resolveSpecialtiesById(ids?: string[]) {
  const selectedIds = ids?.length
    ? ids
    : [MOCK_PROVIDER_SPECIALTIES[0].id];

  try {
    const specialties = await listSpecialties();
    const selectedSpecialties = specialties.filter((specialty) =>
      selectedIds.includes(specialty.id),
    );

    if (selectedSpecialties.length > 0) {
      return selectedSpecialties;
    }
  } catch {
    // Mantem fallback mock quando o catálogo real não está disponível.
  }

  const mockSpecialties = getSpecialtiesById(selectedIds);
  return mockSpecialties.length > 0
    ? mockSpecialties
    : [MOCK_PROVIDER_SPECIALTIES[0]];
}

function createMockUser(email: string, name?: string): MockUser {
  const normalizedEmail = email.trim().toLowerCase();

  if (MOCK_USERS[normalizedEmail]) {
    return MOCK_USERS[normalizedEmail];
  }

  return {
    id: `mock-user-${Date.now()}`,
    name:
      name?.trim() ||
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
      "Usuário MVP",
    email: normalizedEmail,
    role: UserRole.CLIENT,
    isProvider: false,
    isAdmin: false,
    specialties: [],
  };
}

function saveMockUser(user: MockUser) {
  localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
}

function getMockUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const knownMockUser = MOCK_USERS[normalizedEmail];

  if (knownMockUser) {
    return knownMockUser;
  }

  const storedUser = localStorage.getItem(MOCK_USER_STORAGE_KEY);

  if (!storedUser) {
    return createMockUser(normalizedEmail);
  }

  try {
    const user = JSON.parse(storedUser) as MockUser;

    if (user.email === normalizedEmail) {
      return user;
    }
  } catch {
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
  }

  return createMockUser(normalizedEmail);
}

function mockLogin(data: LoginPayload): AuthResponse {
  return {
    token: "mock-token-mvp",
    user: getMockUser(data.email.trim()),
  };
}

function mockRegister(data: RegisterPayload) {
  const role = data.role ?? UserRole.CLIENT;
  const baseUser = createMockUser(data.email.trim(), data.nome);
  const isProvider = role === UserRole.PROVIDER;
  const user: MockUser = {
    ...baseUser,
    role,
    bio: isProvider ? data.bio?.trim() || "Prestador em validação MVP." : "",
    isProvider,
    isAdmin: false,
    specialties: isProvider ? getSpecialtiesById(data.specialtyIds) : [],
  };

  saveMockUser(user);

  return user;
}

export async function becomeProviderService(
  user: User,
  data: {
    bio: string;
    specialtyIds: string[];
  },
) {
  if (localStorage.getItem("token") !== "mock-token-mvp") {
    try {
      const response = await providerApi.register({
        bio: data.bio.trim(),
        specialty_ids: data.specialtyIds,
      });

      if (!response.success) {
        throw new Error(
          response.error?.message ?? "Falha ao ativar perfil de prestador",
        );
      }

      const providerUser: User = {
        ...user,
        role: UserRole.PROVIDER,
        providerId: response.data.id,
        bio: response.data.bio ?? data.bio.trim(),
        isProvider: true,
        isAdmin: false,
        specialties: response.data.specialties.map((item) => ({
          id: item.specialty.id,
          name: item.specialty.name,
          description: item.specialty.description,
          isActive: item.specialty.is_active,
        })),
      };

      saveMockUser(providerUser);
      notifyProvidersChanged();
      return providerUser;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  const specialties = await resolveSpecialtiesById(data.specialtyIds);
  const providerId = user.providerId ?? `mock-provider-${user.id}`;
  const providerUser: User = {
    ...user,
    role: UserRole.PROVIDER,
    providerId,
    bio: data.bio.trim(),
    isProvider: true,
    isAdmin: false,
    specialties,
  };

  upsertMockProviderProfile({
    id: providerId,
    userId: user.id,
    name: user.name,
    bio: data.bio.trim(),
    specialties,
  });
  saveMockUser(providerUser);

  return providerUser;
}

export async function loginService(
  data: LoginPayload,
): Promise<AuthResponse> {
  if (MOCK_USERS[data.email.trim().toLowerCase()]) {
    return mockLogin(data);
  }

  try {
    const loginResponse = await authApi.login({
      email: data.email,
      password: data.password,
    });

    if (!loginResponse.success) {
      throw new Error(
        loginResponse.error?.message ?? "Falha ao realizar login",
      );
    }

    const token = loginResponse.data.access_token;
    const profileResponse = await authApi.me(token);

    if (!profileResponse.success) {
      throw new Error(
        profileResponse.error?.message ??
          "Falha ao buscar perfil do usuário",
      );
    }

    const user: AuthResponse["user"] = {
      id: profileResponse.data.id,
      name:
        profileResponse.data.full_name ||
        profileResponse.data.nome ||
        profileResponse.data.email.split("@")[0],
      email: profileResponse.data.email,
      role: profileResponse.data.role as UserRole | undefined,
      isProvider: profileResponse.data.is_provider ?? false,
      isAdmin: profileResponse.data.is_admin ?? false,
      specialties: [] as AuthResponse["user"]["specialties"],
    };

    if (isRealAdminEmail(data.email) && !user.isAdmin) {
      throw new Error(
        "Usuário admin autenticado, mas sem permissão administrativa no backend.",
      );
    }

    try {
      const providerResponse = await providerApi.me(token);
      if (providerResponse.success) {
        user.role = user.role ?? UserRole.PROVIDER;
        user.providerId = providerResponse.data.id;
        user.isProvider = true;
        user.specialties = providerResponse.data.specialties.map(
          (specialty) => ({
            id: specialty.specialty.id,
            name: specialty.specialty.name,
            description: specialty.specialty.description,
            isActive: specialty.specialty.is_active,
          }),
        );
      }
    } catch {
      // Perfil de prestador pode não existir para clientes.
    }

    return {
      token,
      user,
    };
  } catch (error) {
    if (isRealAdminEmail(data.email)) {
      const apiMessage = getApiErrorMessage(error);
      throw Object.assign(
        new Error(
          apiMessage
            ? `Não foi possível autenticar o admin real: ${apiMessage}`
            : "Não foi possível autenticar o admin real. Verifique se o backend está rodando e se o seed de admin foi executado.",
        ),
        { cause: error },
      );
    }

    if (isNetworkError(error)) {
      return mockLogin(data);
    }

    throw error;
  }
}

export async function registerService(
  data: RegisterPayload,
): Promise<{ id: string; name: string; email: string }> {
  try {
    const response = await authApi.register(data);

    if (!response.success) {
      throw new Error(
        response.error?.message ?? "Falha ao cadastrar usuário",
      );
    }

    const profileResponse = await authApi.me(response.data.access_token);

    if (!profileResponse.success) {
      throw new Error(
        profileResponse.error?.message ??
          "Falha ao recuperar perfil de usuário",
      );
    }

    return {
      id: profileResponse.data.id,
      name:
        profileResponse.data.full_name ||
        profileResponse.data.nome ||
        profileResponse.data.email.split("@")[0],
      email: profileResponse.data.email,
    };
  } catch (error) {
    if (isNetworkError(error)) {
      return mockRegister(data);
    }

    throw error;
  }
}
