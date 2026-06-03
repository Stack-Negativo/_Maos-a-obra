import { useState } from "react";
import { Link } from "react-router-dom";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorMessage } from "@/shared/ui/error_message";
import { Select } from "@/shared/ui/select";

import type {
  Address,
  CreateOrderInput,
  Specialty,
} from "../../types/order_types";

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

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 16);
}

export function OrderForm({
  specialties,
  addresses,
  onSubmit,
  isLoading,
}: OrderFormProps) {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const minPreferredDate = toDateTimeLocalValue(new Date().toISOString());
  const activeSpecialties = specialties.filter((specialty) => specialty.isActive);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Título é obrigatório.";
    } else if (formData.title.trim().length < 3) {
      errors.title = "Título deve ter pelo menos 3 caracteres.";
    } else if (formData.title.trim().length > 100) {
      errors.title = "Título não pode exceder 100 caracteres.";
    }

    if (!formData.description.trim()) {
      errors.description = "Descrição é obrigatória.";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Descrição deve ter pelo menos 10 caracteres.";
    } else if (formData.description.trim().length > 1000) {
      errors.description = "Descrição não pode exceder 1000 caracteres.";
    }

    if (!formData.specialtyId) {
      errors.specialtyId = "Selecione uma especialidade.";
    }

    if (!formData.addressId) {
      errors.addressId = "Selecione um endereço.";
    }

    if (!formData.preferredDate) {
      errors.preferredDate = "Selecione uma data preferida.";
    } else if (new Date(formData.preferredDate) <= new Date()) {
      errors.preferredDate = "A data preferida deve ser futura.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        specialtyId: formData.specialtyId,
        addressId: formData.addressId,
        preferredDate: formData.preferredDate,
      });
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar ordem.");
    }
  };

  return (
    <form className="order-form" onSubmit={handleSubmit}>
      <aside className="order-form__guide" aria-label="Etapas da solicitação">
        <span className="order-form__guide-eyebrow">Solicitação</span>
        <h2>Do pedido ao atendimento</h2>
        <ol>
          <li>
            <strong>1</strong>
            <span>Conte o que precisa com os detalhes principais.</span>
          </li>
          <li>
            <strong>2</strong>
            <span>Prestadores compatíveis enviam candidatura.</span>
          </li>
          <li>
            <strong>3</strong>
            <span>Escolha, acompanhe e avalie ao finalizar.</span>
          </li>
        </ol>
      </aside>

      <div className="order-form__content">
        <div className="order-form__header">
          <h2>Detalhes do serviço</h2>
          <p>
            Quanto melhor a descrição, mais fácil para o prestador avaliar o
            atendimento antes de se candidatar.
          </p>
        </div>

        {error && (
          <ErrorMessage id="form-error">{error}</ErrorMessage>
        )}

        {addresses.length === 0 && (
          <div className="order-form__notice">
            Cadastre um endereço antes de criar uma ordem de serviço.{" "}
            <Link to="/addresses">Cadastrar endereço</Link>
          </div>
        )}

        {activeSpecialties.length === 0 && (
          <div className="order-form__notice">
            Nenhuma especialidade disponível no momento. Atualize a página ou
            peça para o administrador revisar o catálogo.
          </div>
        )}

        <section className="order-form__section">
          <div className="order-form__section-heading">
            <h3>Serviço</h3>
            <span>Nome e descrição do problema</span>
          </div>

          <div className="order-form__group">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Ex: Conserto de torneira"
              value={formData.title}
              onChange={handleChange}
              disabled={isLoading}
              className={fieldErrors.title ? "input--error" : ""}
              required
            />
            {fieldErrors.title && (
              <ErrorMessage>{fieldErrors.title}</ErrorMessage>
            )}
          </div>

          <div className="order-form__group">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Descreva o serviço, o problema e qualquer detalhe importante."
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={5}
              className={fieldErrors.description ? "textarea--error" : ""}
            />
            {fieldErrors.description && (
              <ErrorMessage>{fieldErrors.description}</ErrorMessage>
            )}
          </div>
        </section>

        <section className="order-form__section">
          <div className="order-form__section-heading">
            <h3>Atendimento</h3>
            <span>Categoria, endereço e melhor data</span>
          </div>

          <div className="order-form__grid">
            <div className="order-form__group">
              <Select
                id="specialtyId"
                name="specialtyId"
                value={formData.specialtyId}
                onChange={handleChange}
                disabled={isLoading || activeSpecialties.length === 0}
                options={[
                  { value: "", label: "Selecione uma especialidade" },
                  ...activeSpecialties.map((specialty) => ({
                    value: specialty.id,
                    label: specialty.name,
                  })),
                ]}
                label="Especialidade"
                required
              />
              {fieldErrors.specialtyId && (
                <ErrorMessage>{fieldErrors.specialtyId}</ErrorMessage>
              )}
            </div>

            <div className="order-form__group">
              <Select
                id="addressId"
                name="addressId"
                value={formData.addressId}
                onChange={handleChange}
                disabled={isLoading || addresses.length === 0}
                options={[
                  { value: "", label: "Selecione um endereço" },
                  ...addresses.map((address) => ({
                    value: address.id,
                    label: `${address.street}, ${address.number} - ${address.city}`,
                  })),
                ]}
                label="Endereço"
                required
              />
              {fieldErrors.addressId && (
                <ErrorMessage>{fieldErrors.addressId}</ErrorMessage>
              )}
            </div>
          </div>

          <div className="order-form__group">
            <Label htmlFor="preferredDate">Data preferida</Label>
            <Input
              id="preferredDate"
              name="preferredDate"
              type="datetime-local"
              min={minPreferredDate}
              value={formData.preferredDate}
              onChange={handleChange}
              disabled={isLoading}
              className={fieldErrors.preferredDate ? "input--error" : ""}
              required
            />
            {fieldErrors.preferredDate && (
              <ErrorMessage>{fieldErrors.preferredDate}</ErrorMessage>
            )}
          </div>
        </section>

        <button
          type="submit"
          className="order-form__submit"
          disabled={
            isLoading || addresses.length === 0 || activeSpecialties.length === 0
          }
        >
          {isLoading ? "Criando..." : "Criar ordem de serviço"}
        </button>
      </div>
    </form>
  );
}
