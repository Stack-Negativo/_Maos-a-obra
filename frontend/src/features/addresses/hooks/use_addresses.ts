import { useEffect, useMemo, useState } from "react";

import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from "../services/addresses_service";
import type { Address, AddressPayload } from "../types/address_types";

const INITIAL_FORM: AddressPayload = {
  label: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressPayload>(INITIAL_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      setAddresses(await listAddresses());
    } catch {
      setError("Não foi possível carregar os endereços.");
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

  function updateField(field: keyof AddressPayload, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.label.trim()) {
      return "Informe um nome para o endereço.";
    }

    if (!/^\d{8}$/.test(form.zipCode.replace(/\D/g, ""))) {
      return "Informe um CEP com 8 dígitos.";
    }

    if (!form.street.trim()) {
      return "Informe a rua.";
    }

    if (!form.number.trim()) {
      return "Informe o número.";
    }

    if (!form.neighborhood.trim()) {
      return "Informe o bairro.";
    }

    if (!form.city.trim()) {
      return "Informe a cidade.";
    }

    if (!/^[A-Za-z]{2}$/.test(form.state.trim())) {
      return "Informe o estado com 2 letras.";
    }

    return null;
  }

  async function submitAddress() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      ...form,
      label: form.label.trim(),
      zipCode: form.zipCode.replace(/\D/g, ""),
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
    };

    try {
      const address = editingAddressId
        ? await updateAddress(editingAddressId, payload)
        : await createAddress(payload);

      setAddresses((currentAddresses) =>
        editingAddressId
          ? currentAddresses.map((currentAddress) =>
              currentAddress.id === editingAddressId ? address : currentAddress,
            )
          : [address, ...currentAddresses],
      );
      setForm(INITIAL_FORM);
      setEditingAddressId(null);
    } catch {
      setError("Não foi possível salvar o endereço.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeAddress(addressId: string) {
    setError(null);

    try {
      await deleteAddress(addressId);
      setAddresses((currentAddresses) =>
        currentAddresses.filter((address) => address.id !== addressId),
      );
      if (editingAddressId === addressId) {
        setEditingAddressId(null);
        setForm(INITIAL_FORM);
      }
    } catch {
      setError("Não foi possível remover o endereço.");
    }
  }

  function startEditingAddress(address: Address) {
    setEditingAddressId(address.id);
    setForm({
      label: address.label,
      zipCode: address.zipCode,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
    });
    setError(null);
  }

  function cancelEditingAddress() {
    setEditingAddressId(null);
    setForm(INITIAL_FORM);
    setError(null);
  }

  const filteredAddresses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return addresses;
    }

    return addresses.filter((address) =>
      [
        address.label,
        address.street,
        address.neighborhood,
        address.city,
        address.state,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [addresses, search]);

  return {
    addresses: filteredAddresses,
    totalAddresses: addresses.length,
    form,
    search,
    loading,
    submitting,
    editingAddressId,
    error,
    setSearch,
    updateField,
    submitAddress,
    removeAddress,
    startEditingAddress,
    cancelEditingAddress,
    refresh,
  };
}
