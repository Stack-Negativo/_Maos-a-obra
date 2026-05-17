import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { listSpecialties } from "../services/specialties_service";
import type { Specialty } from "../types/specialty_types";

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadSpecialties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listSpecialties();
      setSpecialties(data);
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

  return {
    specialties: filteredSpecialties,
    loading,
    error,
    search,
    setSearch,
    refresh: loadSpecialties,
  };
}
