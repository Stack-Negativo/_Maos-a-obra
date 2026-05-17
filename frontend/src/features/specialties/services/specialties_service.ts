import axios from "axios";

import { specialtiesApi } from "@/api/specialties";

import type { Specialty } from "../types/specialty_types";

const MOCK_SPECIALTIES: Specialty[] = [
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
  {
    id: "mock-specialty-marcenaria",
    name: "Marcenaria",
    description: "Ajustes em portas, moveis planejados e pequenos reparos.",
    isActive: true,
  },
  {
    id: "mock-specialty-ar-condicionado",
    name: "Ar condicionado",
    description: "Instalacao, limpeza e manutencao preventiva.",
    isActive: false,
  },
];

function isNetworkError(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    !error.response
  );
}

function mapSpecialty(item: {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}): Specialty {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
  };
}

export async function listSpecialties(): Promise<Specialty[]> {
  try {
    const response =
      await specialtiesApi.getAll();

    if (!response.success) {
      throw new Error(
        response.error?.message ?? "Falha ao buscar especialidades",
      );
    }

    return response.data.map(mapSpecialty);
  } catch (error) {
    if (isNetworkError(error)) {
      return MOCK_SPECIALTIES;
    }

    throw error;
  }
}
