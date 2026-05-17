import { useState } from "react";
import type {
  Address,
  CreateOrderInput,
  Specialty,
} from "../../types/order_types";
import { Input } from "@/shared/ui/input";

import "./order_form.css";

type OrderFormProps = {
  specialties: Specialty[];
  addresses: Address[];
  onSubmit: (data: CreateOrderInput) => Promise<void>;
  isLoading?: boolean;
};

type FormData = {
  title: string;
  description: string;
  specialtyId: string;
  addressId: string;
  preferredDate: string;
};

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  specialtyId: "",
  addressId: "",
  preferredDate: "",
};

export function OrderForm({
  specialties,
  addresses,
  onSubmit,
  isLoading,
}: OrderFormProps) {
  const [formData, setFormData] = useState<FormData>(
    EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Título é obrigatório";
    } else if (formData.title.length < 3) {
      errors.title = "Título deve ter pelo menos 3 caracteres";
    } else if (formData.title.length > 100) {
      errors.title = "Título não pode exceder 100 caracteres";
    }

    if (!formData.description.trim()) {
      errors.description = "Descrição é obrigatória";
    } else if (formData.description.length < 10) {
      errors.description =
        "Descrição deve ter pelo menos 10 caracteres";
    } else if (formData.description.length > 1000) {
      errors.description =
        "Descrição não pode exceder 1000 caracteres";
    }

    if (!formData.specialtyId) {
      errors.specialtyId = "Selecione uma especialidade";
    }

    if (!formData.addressId) {
      errors.addressId = "Selecione um endereço";
    }

    if (!formData.preferredDate) {
      errors.preferredDate = "Selecione uma data";
    } else if (new Date(formData.preferredDate) <= new Date()) {
      errors.preferredDate = "A data deve ser no futuro";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        specialtyId: parseInt(formData.specialtyId),
        addressId: parseInt(formData.addressId),
        preferredDate: formData.preferredDate,
      });
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar ordem",
      );
    }
  };

  return (
    <form
      className="order-form"
      onSubmit={handleSubmit}
    >
      <div className="order-form__header">
        <h2>Nova Ordem de Serviço</h2>
        <p>Preencha os dados abaixo para criar uma nova ordem.</p>
      </div>

      {error && (
        <div className="order-form__error" role="alert">
          {error}
        </div>
      )}

      <div className="order-form__group">
        <label htmlFor="title" className="order-form__label">
          Título *
        </label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="Ex: Limpeza geral da casa"
          value={formData.title}
          onChange={handleChange}
          disabled={isLoading}
          className={
            fieldErrors.title ? "input--error" : ""
          }
        />
        {fieldErrors.title && (
          <small className="order-form__field-error">
            {fieldErrors.title}
          </small>
        )}
      </div>

      <div className="order-form__group">
        <label
          htmlFor="description"
          className="order-form__label"
        >
          Descrição *
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="Descreva o serviço em detalhes..."
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          rows={5}
          className={
            fieldErrors.description ? "textarea--error" : ""
          }
        />
        {fieldErrors.description && (
          <small className="order-form__field-error">
            {fieldErrors.description}
          </small>
        )}
      </div>

      <div className="order-form__grid">
        <div className="order-form__group">
          <label
            htmlFor="specialtyId"
            className="order-form__label"
          >
            Especialidade *
          </label>
          <select
            id="specialtyId"
            name="specialtyId"
            value={formData.specialtyId}
            onChange={handleChange}
            disabled={
              isLoading || specialties.length === 0
            }
            className={
              fieldErrors.specialtyId ? "select--error" : ""
            }
          >
            <option value="">Selecione uma especialidade</option>
            {specialties
              .filter((s) => s.isActive)
              .map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
          </select>
          {fieldErrors.specialtyId && (
            <small className="order-form__field-error">
              {fieldErrors.specialtyId}
            </small>
          )}
        </div>

        <div className="order-form__group">
          <label
            htmlFor="addressId"
            className="order-form__label"
          >
            Endereço *
          </label>
          <select
            id="addressId"
            name="addressId"
            value={formData.addressId}
            onChange={handleChange}
            disabled={isLoading || addresses.length === 0}
            className={
              fieldErrors.addressId ? "select--error" : ""
            }
          >
            <option value="">Selecione um endereço</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.street}, {address.number} - {address.city}
              </option>
            ))}
          </select>
          {fieldErrors.addressId && (
            <small className="order-form__field-error">
              {fieldErrors.addressId}
            </small>
          )}
        </div>
      </div>

      <div className="order-form__group">
        <label
          htmlFor="preferredDate"
          className="order-form__label"
        >
          Data Preferida *
        </label>
        <Input
          id="preferredDate"
          name="preferredDate"
          type="datetime-local"
          value={formData.preferredDate}
          onChange={handleChange}
          disabled={isLoading}
          className={
            fieldErrors.preferredDate ? "input--error" : ""
          }
        />
        {fieldErrors.preferredDate && (
          <small className="order-form__field-error">
            {fieldErrors.preferredDate}
          </small>
        )}
      </div>

      <button
        type="submit"
        className="order-form__submit"
        disabled={isLoading}
      >
        {isLoading ? "Criando..." : "Criar Ordem de Serviço"}
      </button>
    </form>
  );
}
