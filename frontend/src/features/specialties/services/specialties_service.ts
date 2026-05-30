import { specialtiesApi } from "@/api/specialties";
import { isMockMode } from "@/shared/mocks/mock_mode";
import { mockStore } from "@/shared/mocks/mock_store";

import type { Specialty, SpecialtyRequest } from "../types/specialty_types";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapSpecialty(item: {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
}): Specialty {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    isActive: item.is_active,
  };
}

export async function listSpecialties(): Promise<Specialty[]> {
  if (isMockMode()) {
    return mockStore.listSpecialties();
  }

  const response = await specialtiesApi.getAll();

  if (!response.success) {
    throw new Error(
      response.error?.message ?? "Falha ao buscar especialidades",
    );
  }

  return response.data.map(mapSpecialty);
}

export async function listSpecialtyRequests(): Promise<SpecialtyRequest[]> {
  if (isMockMode()) {
    return mockStore.listSpecialtyRequests();
  }

  return [];
}

export async function createSpecialty(input: {
  name: string;
  description: string;
  isActive?: boolean;
}) {
  if (isMockMode()) {
    return mockStore.createSpecialty(input);
  }

  const specialties = await listSpecialties();
  const alreadyExists = specialties.some(
    (specialty) => normalizeText(specialty.name) === normalizeText(input.name),
  );

  if (alreadyExists) {
    throw new Error("Já existe uma especialidade com esse nome.");
  }

  const response = await specialtiesApi.create({
    name: input.name.trim(),
    description: input.description.trim(),
    is_active: input.isActive ?? true,
  });

  if (!response.success) {
    throw new Error(
      response.error?.message ?? "Falha ao criar especialidade",
    );
  }

  return mapSpecialty(response.data);
}

export async function toggleSpecialtyStatus(specialtyId: string) {
  if (isMockMode()) {
    return mockStore.toggleSpecialtyStatus(specialtyId);
  }

  const specialties = await listSpecialties();
  const currentSpecialty = specialties.find(
    (specialty) => specialty.id === specialtyId,
  );

  if (!currentSpecialty) {
    throw new Error("Especialidade não encontrada.");
  }

  const response = await specialtiesApi.update(specialtyId, {
    is_active: !currentSpecialty.isActive,
  });

  if (!response.success) {
    throw new Error(
      response.error?.message ?? "Falha ao atualizar especialidade",
    );
  }

  return mapSpecialty(response.data);
}

export async function requestSpecialty(..._args: unknown[]) {
  void _args;
  throw new Error(
    "Solicitação de especialidade indisponível no momento. Peça ao admin para criar a categoria.",
  );
}

export async function approveSpecialtyRequest(requestId: string) {
  if (isMockMode()) {
    return mockStore.approveSpecialtyRequest(requestId).request;
  }

  throw new Error("Não há solicitações de especialidade pendentes.");
}

export async function rejectSpecialtyRequest(requestId: string) {
  if (isMockMode()) {
    return mockStore.rejectSpecialtyRequest(requestId);
  }

  throw new Error("Não há solicitações de especialidade pendentes.");
}
