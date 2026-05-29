import { useEffect, useMemo, useState } from "react";

import { listSpecialties } from "@/features/specialties/services/specialties_service";
import type { Specialty } from "@/features/specialties/types/specialty_types";

import {
  createProviderProfile,
  listProviders,
  PROVIDERS_CHANGED_EVENT,
  suspendProvider,
  unsuspendProvider,
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
  const [updatingProviderId, setUpdatingProviderId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const [providerData, specialtyData] = await Promise.all([
        listProviders(),
        listSpecialties(),
      ]);

      setProviders(providerData);
      setSpecialties(specialtyData.filter((specialty) => specialty.isActive));
    } catch {
      setError(
        "Nao foi possivel carregar os prestadores. Verifique o backend e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    const handleProvidersChanged = () => {
      void refresh();
    };

    window.addEventListener(PROVIDERS_CHANGED_EVENT, handleProvidersChanged);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(
        PROVIDERS_CHANGED_EVENT,
        handleProvidersChanged,
      );
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
      const isSelected = currentForm.specialtyIds.includes(specialtyId);

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
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedSpecialties = specialties.filter((specialty) =>
        form.specialtyIds.includes(specialty.id),
      );

      const provider = await createProviderProfile({
        name: form.name.trim(),
        bio: form.bio.trim(),
        specialties: selectedSpecialties,
      });

      setProviders((currentProviders) => [provider, ...currentProviders]);
      setForm(INITIAL_FORM);
    } catch {
      setError(
        "Nao foi possivel salvar o prestador. Verifique o backend e tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function suspend(providerId: string) {
    setUpdatingProviderId(providerId);
    setError(null);

    try {
      const provider = await suspendProvider(providerId);
      setProviders((currentProviders) =>
        currentProviders.map((currentProvider) =>
          currentProvider.id === providerId
            ? {
                ...currentProvider,
                ...provider,
              }
            : currentProvider,
        ),
      );
    } catch {
      setError("Nao foi possivel suspender o prestador no backend.");
    } finally {
      setUpdatingProviderId(null);
    }
  }

  async function unsuspend(providerId: string) {
    setUpdatingProviderId(providerId);
    setError(null);

    try {
      const provider = await unsuspendProvider(providerId);
      setProviders((currentProviders) =>
        currentProviders.map((currentProvider) =>
          currentProvider.id === providerId
            ? {
                ...currentProvider,
                ...provider,
              }
            : currentProvider,
        ),
      );
    } catch {
      setError("Nao foi possivel reativar o prestador no backend.");
    } finally {
      setUpdatingProviderId(null);
    }
  }

  const filteredProviders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesSearch =
        !query ||
        [provider.name, provider.bio, ...provider.specialties.map((s) => s.name)]
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
  const suspendedProviders = providers.filter(
    (provider) => provider.isSuspended,
  ).length;
  const activeProviders = Math.max(providers.length - suspendedProviders, 0);

  return {
    providers: filteredProviders,
    totalProviders: providers.length,
    activeProviders,
    suspendedProviders,
    specialties,
    form,
    search,
    specialtyFilter,
    loading,
    submitting,
    updatingProviderId,
    error,
    setSearch,
    setSpecialtyFilter,
    updateField,
    toggleSpecialty,
    submitProvider,
    suspendProvider: suspend,
    unsuspendProvider: unsuspend,
    refresh,
  };
}
