import { useState } from "react";

import { Input } from "@/shared/ui/input";

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
        <span className="order-form__guide-eyebrow">Fluxo do cliente</span>
        <h2>Como a ordem avança</h2>
        <ol>
          <li>
            <strong>1</strong>
            <span>Você publica a necessidade.</span>
          </li>
          <li>
            <strong>2</strong>
            <span>Prestadores compatíveis se candidatam.</span>
          </li>
          <li>
            <strong>3</strong>
            <span>Você escolhe, agenda e confirma a finalização.</span>
          </li>
        </ol>
      </aside>

      <div className="order-form__content">
        <div className="order-form__header">
          <h2>Detalhes da solicitação</h2>
          <p>
            Descreva a necessidade com clareza. O agendamento oficial será
            confirmado depois que um prestador for selecionado.
          </p>
        </div>

        {error && (
          <div className="order-form__error" role="alert">
            {error}
          </div>
        )}

        {addresses.length === 0 && (
          <div className="order-form__notice">
            Cadastre um endereço antes de criar uma ordem de serviço.
          </div>
        )}

        {activeSpecialties.length === 0 && (
          <div className="order-form__notice">
            Nenhuma especialidade ativa encontrada. Atualize a página ou peça
            para o administrador cadastrar/ativar especialidades no catálogo.
          </div>
        )}

        <section className="order-form__section">
          <div className="order-form__section-heading">
            <h3>Serviço</h3>
            <span>Nome e descrição do problema</span>
          </div>

          <div className="order-form__group">
            <label htmlFor="title" className="order-form__label">
              Título *
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Ex: Conserto de torneira"
              value={formData.title}
              onChange={handleChange}
              disabled={isLoading}
              className={fieldErrors.title ? "input--error" : ""}
            />
            {fieldErrors.title && (
              <small className="order-form__field-error">
                {fieldErrors.title}
              </small>
            )}
          </div>

          <div className="order-form__group">
            <label htmlFor="description" className="order-form__label">
              Descrição *
            </label>
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
              <small className="order-form__field-error">
                {fieldErrors.description}
              </small>
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
              <label htmlFor="specialtyId" className="order-form__label">
                Especialidade *
              </label>
              <select
                id="specialtyId"
                name="specialtyId"
                value={formData.specialtyId}
                onChange={handleChange}
                disabled={isLoading || activeSpecialties.length === 0}
                className={fieldErrors.specialtyId ? "select--error" : ""}
              >
                <option value="">Selecione uma especialidade</option>
                {activeSpecialties.map((specialty) => (
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
              <label htmlFor="addressId" className="order-form__label">
                Endereço *
              </label>
              <select
                id="addressId"
                name="addressId"
                value={formData.addressId}
                onChange={handleChange}
                disabled={isLoading || addresses.length === 0}
                className={fieldErrors.addressId ? "select--error" : ""}
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
            <label htmlFor="preferredDate" className="order-form__label">
              Data preferida *
            </label>
            <Input
              id="preferredDate"
              name="preferredDate"
              type="datetime-local"
              min={minPreferredDate}
              value={formData.preferredDate}
              onChange={handleChange}
              disabled={isLoading}
              className={fieldErrors.preferredDate ? "input--error" : ""}
            />
            {fieldErrors.preferredDate && (
              <small className="order-form__field-error">
                {fieldErrors.preferredDate}
              </small>
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
