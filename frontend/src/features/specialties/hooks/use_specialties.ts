import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  approveSpecialtyRequest,
  createSpecialty,
  listSpecialties,
  listSpecialtyRequests,
  rejectSpecialtyRequest,
  requestSpecialty,
  toggleSpecialtyStatus,
} from "../services/specialties_service";
import type {
  Specialty,
  SpecialtyRequest,
} from "../types/specialty_types";

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [requests, setRequests] = useState<SpecialtyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadSpecialties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [data, requestData] = await Promise.all([
        listSpecialties(),
        listSpecialtyRequests(),
      ]);
      setSpecialties(data);
      setRequests(requestData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar especialidades",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSpecialties();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadSpecialties]);

  const filteredSpecialties = useMemo(
    () =>
      specialties.filter((specialty) => {
        const query = search.trim().toLowerCase();
        if (!query) {
          return true;
        }

        return (
          specialty.name.toLowerCase().includes(query) ||
          specialty.description.toLowerCase().includes(query)
        );
      }),
    [search, specialties],
  );

  async function createCatalogSpecialty(input: {
    name: string;
    description: string;
    isActive?: boolean;
  }) {
    await createSpecialty(input);
    await loadSpecialties();
  }

  async function toggleCatalogSpecialty(specialtyId: string) {
    await toggleSpecialtyStatus(specialtyId);
    await loadSpecialties();
  }

  async function submitSpecialtyRequest(input: {
    name: string;
    description: string;
    requestedBy: string;
    requestedByName: string;
  }) {
    await requestSpecialty(input);
    await loadSpecialties();
  }

  async function approveRequest(requestId: string) {
    await approveSpecialtyRequest(requestId);
    await loadSpecialties();
  }

  async function rejectRequest(requestId: string) {
    await rejectSpecialtyRequest(requestId);
    await loadSpecialties();
  }

  return {
    specialties: filteredSpecialties,
    allSpecialties: specialties,
    requests,
    loading,
    error,
    search,
    setSearch,
    refresh: loadSpecialties,
    createCatalogSpecialty,
    toggleCatalogSpecialty,
    submitSpecialtyRequest,
    approveRequest,
    rejectRequest,
  };
}
