import axios from "axios";

import { specialtiesApi } from "@/api/specialties";

import type {
  Specialty,
  SpecialtyRequest,
} from "../types/specialty_types";

const SPECIALTIES_STORAGE_KEY = "maos_a_obra_mock_specialties_v2";
const SPECIALTY_REQUESTS_STORAGE_KEY =
  "maos_a_obra_mock_specialty_requests_v1";

const MOCK_SPECIALTIES: Specialty[] = [
  {
    id: "mock-specialty-eletrica",
    name: "Elétrica",
    description:
      "Troca de chuveiro, tomadas, disjuntores e instalações simples.",
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
  {
    id: "mock-specialty-marcenaria",
    name: "Marcenaria",
    description: "Ajustes em portas, móveis planejados e pequenos reparos.",
    isActive: true,
  },
  {
    id: "mock-specialty-ar-condicionado",
    name: "Ar condicionado",
    description: "Instalação, limpeza e manutenção preventiva.",
    isActive: false,
  },
];

const INITIAL_SPECIALTY_REQUESTS: SpecialtyRequest[] = [
  {
    id: "mock-specialty-request-jardinagem",
    name: "Jardinagem",
    description: "Manutenção de jardins, poda leve e limpeza de área externa.",
    requestedBy: "mock-provider",
    requestedByName: "João Prestador",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

function isNetworkError(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}

function isMockSession() {
  return localStorage.getItem("token") === "mock-token-mvp";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function readSpecialties() {
  const stored = localStorage.getItem(SPECIALTIES_STORAGE_KEY);

  if (!stored) {
    return MOCK_SPECIALTIES;
  }

  try {
    return JSON.parse(stored) as Specialty[];
  } catch {
    localStorage.removeItem(SPECIALTIES_STORAGE_KEY);
    return MOCK_SPECIALTIES;
  }
}

function persistSpecialties(specialties: Specialty[]) {
  localStorage.setItem(SPECIALTIES_STORAGE_KEY, JSON.stringify(specialties));
}

function readSpecialtyRequests() {
  const stored = localStorage.getItem(SPECIALTY_REQUESTS_STORAGE_KEY);

  if (!stored) {
    return INITIAL_SPECIALTY_REQUESTS;
  }

  try {
    return JSON.parse(stored) as SpecialtyRequest[];
  } catch {
    localStorage.removeItem(SPECIALTY_REQUESTS_STORAGE_KEY);
    return INITIAL_SPECIALTY_REQUESTS;
  }
}

function persistSpecialtyRequests(requests: SpecialtyRequest[]) {
  localStorage.setItem(
    SPECIALTY_REQUESTS_STORAGE_KEY,
    JSON.stringify(requests),
  );
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

async function bootstrapApiSpecialties() {
  const createdSpecialties: Specialty[] = [];

  for (const specialty of MOCK_SPECIALTIES.filter((item) => item.isActive)) {
    try {
      const response = await specialtiesApi.create({
        name: specialty.name,
        description: specialty.description,
        is_active: true,
      });

      if (response.success) {
        createdSpecialties.push(mapSpecialty(response.data));
      }
    } catch (error) {
      if (!isNetworkError(error)) {
        continue;
      }

      throw error;
    }
  }

  if (createdSpecialties.length > 0) {
    return createdSpecialties;
  }

  const response = await specialtiesApi.getAll();

  if (!response.success) {
    throw new Error(
      response.error?.message ?? "Falha ao buscar especialidades",
    );
  }

  return response.data.map(mapSpecialty);
}

export async function listSpecialties(): Promise<Specialty[]> {
  if (isMockSession()) {
    return readSpecialties();
  }

  try {
    const response = await specialtiesApi.getAll();

    if (!response.success) {
      throw new Error(
        response.error?.message ?? "Falha ao buscar especialidades",
      );
    }

    const specialties = response.data.map(mapSpecialty);

    if (specialties.length === 0) {
      return bootstrapApiSpecialties();
    }

    return specialties;
  } catch (error) {
    if (isNetworkError(error)) {
      return readSpecialties();
    }

    throw error;
  }
}

export async function listSpecialtyRequests() {
  return readSpecialtyRequests();
}

export async function createSpecialty(input: {
  name: string;
  description: string;
  isActive?: boolean;
}) {
  if (!isMockSession()) {
    try {
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
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  const specialties = readSpecialties();
  const alreadyExists = specialties.some(
    (specialty) => normalizeText(specialty.name) === normalizeText(input.name),
  );

  if (alreadyExists) {
    throw new Error("Já existe uma especialidade com esse nome.");
  }

  const specialty: Specialty = {
    id: `mock-specialty-${normalizeText(input.name).replace(/\s+/g, "-")}`,
    name: input.name.trim(),
    description: input.description.trim(),
    isActive: input.isActive ?? true,
  };

  persistSpecialties([specialty, ...specialties]);

  return specialty;
}

export async function toggleSpecialtyStatus(specialtyId: string) {
  const specialties = readSpecialties();
  const currentSpecialty = specialties.find(
    (specialty) => specialty.id === specialtyId,
  );

  if (!currentSpecialty) {
    throw new Error("Especialidade não encontrada.");
  }

  if (!isMockSession()) {
    try {
      const response = await specialtiesApi.update(specialtyId, {
        is_active: !currentSpecialty.isActive,
      });

      if (!response.success) {
        throw new Error(
          response.error?.message ?? "Falha ao atualizar especialidade",
        );
      }

      return mapSpecialty(response.data);
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  const nextSpecialties = specialties.map((specialty) =>
    specialty.id === specialtyId
      ? {
          ...specialty,
          isActive: !specialty.isActive,
        }
      : specialty,
  );

  persistSpecialties(nextSpecialties);

  return nextSpecialties.find((specialty) => specialty.id === specialtyId);
}

export async function requestSpecialty(input: {
  name: string;
  description: string;
  requestedBy: string;
  requestedByName: string;
}) {
  const specialties = readSpecialties();
  const requests = readSpecialtyRequests();
  const normalizedName = normalizeText(input.name);
  const alreadyExists = specialties.some(
    (specialty) => normalizeText(specialty.name) === normalizedName,
  );
  const alreadyPending = requests.some(
    (request) =>
      normalizeText(request.name) === normalizedName &&
      request.status === "PENDING",
  );

  if (alreadyExists) {
    throw new Error("Essa especialidade já existe no catálogo.");
  }

  if (alreadyPending) {
    throw new Error("Já existe uma solicitação pendente com esse nome.");
  }

  const request: SpecialtyRequest = {
    id: `mock-specialty-request-${Date.now()}`,
    name: input.name.trim(),
    description: input.description.trim(),
    requestedBy: input.requestedBy,
    requestedByName: input.requestedByName,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  persistSpecialtyRequests([request, ...requests]);

  return request;
}

export async function approveSpecialtyRequest(requestId: string) {
  const requests = readSpecialtyRequests();
  const request = requests.find((item) => item.id === requestId);

  if (!request) {
    throw new Error("Solicitação não encontrada.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Essa solicitação já foi analisada.");
  }

  await createSpecialty({
    name: request.name,
    description: request.description,
    isActive: true,
  });

  const nextRequests = requests.map((item) =>
    item.id === requestId
      ? {
          ...item,
          status: "APPROVED" as const,
          reviewedAt: new Date().toISOString(),
        }
      : item,
  );

  persistSpecialtyRequests(nextRequests);

  return nextRequests;
}

export async function rejectSpecialtyRequest(requestId: string) {
  const requests = readSpecialtyRequests();
  const nextRequests = requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status: "REJECTED" as const,
          reviewedAt: new Date().toISOString(),
        }
      : request,
  );

  persistSpecialtyRequests(nextRequests);

  return nextRequests;
}
