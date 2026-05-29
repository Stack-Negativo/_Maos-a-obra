import axios from "axios";

import { authApi } from "@/api/auth";
import { providerApi } from "@/api/providers";
import { listSpecialties } from "@/features/specialties/services/specialties_service";
import { notifyProvidersChanged } from "@/features/providers/services/providers_service";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../types";
import { UserRole } from "../types/auth_types";

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

async function resolveSpecialtiesById(ids: string[]) {
  const specialties = await listSpecialties();
  return specialties.filter((specialty) => ids.includes(specialty.id));
}

function mapUser(profile: {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  nome?: string;
  role?: string;
  is_provider?: boolean;
  is_admin?: boolean;
}): User {
  return {
    id: profile.id,
    name: profile.full_name || profile.nome || profile.email.split("@")[0],
    email: profile.email,
    phone: profile.phone,
    role:
      (profile.role as UserRole | undefined) ??
      (profile.is_admin
        ? UserRole.ADMIN
        : profile.is_provider
          ? UserRole.PROVIDER
          : UserRole.CLIENT),
    isProvider: profile.is_provider ?? false,
    isAdmin: profile.is_admin ?? false,
    specialties: [],
  };
}

export async function updateProfileService(data: {
  name: string;
  phone: string;
}): Promise<Pick<User, "name" | "phone">> {
  const response = await authApi.updateMe({
    full_name: data.name.trim(),
    phone: data.phone.replace(/\D/g, ""),
  });

  if (!response.success) {
    throw new Error(response.error?.message ?? "Falha ao atualizar perfil");
  }

  return {
    name: response.data.full_name || response.data.nome || data.name.trim(),
    phone: response.data.phone ?? data.phone.replace(/\D/g, ""),
  };
}

export async function becomeProviderService(
  user: User,
  data: {
    bio: string;
    specialtyIds: string[];
  },
) {
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

  notifyProvidersChanged();
  return providerUser;
}

export async function loginService(data: LoginPayload): Promise<AuthResponse> {
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
        profileResponse.error?.message ?? "Falha ao buscar perfil do usuário",
      );
    }

    const user = mapUser(profileResponse.data);

    if (isRealAdminEmail(data.email) && !user.isAdmin) {
      throw new Error(
        "Conta administrativa sem permissão ativa.",
      );
    }

    try {
      const providerResponse = await providerApi.me(token);
      if (providerResponse.success) {
        user.role = user.role ?? UserRole.PROVIDER;
        user.providerId = providerResponse.data.id;
        user.isProvider = true;
        user.specialties = providerResponse.data.specialties.map((specialty) => ({
          id: specialty.specialty.id,
          name: specialty.specialty.name,
          description: specialty.specialty.description,
          isActive: specialty.specialty.is_active,
        }));
      }
    } catch {
      // Clientes e admins não precisam ter perfil de prestador.
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
            ? `Não foi possível autenticar a conta administrativa: ${apiMessage}`
            : "Não foi possível autenticar a conta administrativa.",
        ),
        { cause: error },
      );
    }

    throw error;
  }
}

export async function registerService(
  data: RegisterPayload,
): Promise<{ id: string; name: string; email: string }> {
  let response;

  try {
    response = await authApi.register(data);
  } catch (error) {
    throw Object.assign(
      new Error(getApiErrorMessage(error) ?? "Falha ao cadastrar usuário"),
      { cause: error },
    );
  }

  if (!response.success) {
    throw new Error(response.error?.message ?? "Falha ao cadastrar usuário");
  }

  const profileResponse = await authApi.me(response.data.access_token);

  if (!profileResponse.success) {
    throw new Error(
      profileResponse.error?.message ?? "Falha ao recuperar perfil de usuário",
    );
  }

  if (data.role === UserRole.PROVIDER && data.specialtyIds?.length) {
    const specialties = await resolveSpecialtiesById(data.specialtyIds);
    if (specialties.length !== data.specialtyIds.length) {
      throw new Error("Uma ou mais especialidades selecionadas não existem.");
    }
  }

  return {
    id: profileResponse.data.id,
    name:
      profileResponse.data.full_name ||
      profileResponse.data.nome ||
      profileResponse.data.email.split("@")[0],
    email: profileResponse.data.email,
  };
}
