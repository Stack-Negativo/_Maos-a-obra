import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { listSpecialties } from "@/features/specialties/services/specialties_service";
import type { Specialty } from "@/features/specialties/types/specialty_types";

import {
  createProviderProfile,
  listProviders,
} from "../services/providers_service";
import type { ProviderProfile } from "../types/provider_types";

type ProviderForm = {
  name: string;
  bio: string;
  specialtyIds: string[];
};

const INITIAL_FORM: ProviderForm = {
  name: "",
  bio: "",
  specialtyIds: [],
};

export function useProviders() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [form, setForm] = useState<ProviderForm>(INITIAL_FORM);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const [
        providerData,
        specialtyData,
      ] = await Promise.all([
        listProviders(),
        listSpecialties(),
      ]);

      setProviders(providerData);
      setSpecialties(
        specialtyData.filter((specialty) => specialty.isActive),
      );
    } catch {
      setError("Nao foi possivel carregar prestadores mockados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  function updateField(
    field: keyof Omit<ProviderForm, "specialtyIds">,
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function toggleSpecialty(specialtyId: string) {
    setForm((currentForm) => {
      const isSelected =
        currentForm.specialtyIds.includes(specialtyId);

      return {
        ...currentForm,
        specialtyIds: isSelected
          ? currentForm.specialtyIds.filter((id) => id !== specialtyId)
          : [...currentForm.specialtyIds, specialtyId],
      };
    });
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Informe o nome do prestador.";
    }

    if (form.bio.trim().length < 20) {
      return "Informe uma bio com pelo menos 20 caracteres.";
    }

    if (form.specialtyIds.length === 0) {
      return "Selecione pelo menos uma especialidade.";
    }

    return null;
  }

  async function submitProvider() {
    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedSpecialties =
        specialties.filter((specialty) =>
          form.specialtyIds.includes(specialty.id),
        );

      const provider =
        await createProviderProfile({
          name: form.name.trim(),
          bio: form.bio.trim(),
          specialties: selectedSpecialties,
        });

      setProviders((currentProviders) => [
        provider,
        ...currentProviders,
      ]);
      setForm(INITIAL_FORM);
    } catch {
      setError("Nao foi possivel salvar o prestador mockado.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProviders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesSearch =
        !query ||
        [
          provider.name,
          provider.bio,
          ...provider.specialties.map((specialty) => specialty.name),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesSpecialty =
        specialtyFilter === "all" ||
        provider.specialties.some(
          (specialty) => specialty.id === specialtyFilter,
        );

      return matchesSearch && matchesSpecialty;
    });
  }, [providers, search, specialtyFilter]);

  return {
    providers: filteredProviders,
    totalProviders: providers.length,
    specialties,
    form,
    search,
    specialtyFilter,
    loading,
    submitting,
    error,
    setSearch,
    setSpecialtyFilter,
    updateField,
    toggleSpecialty,
    submitProvider,
    refresh,
  };
}
