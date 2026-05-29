import { Link } from "react-router-dom";

import { AppShell } from "@/shared/components";
import { Input } from "@/shared/ui/input";

import { useAddresses } from "../../hooks/use_addresses";

import "./addresses_page.css";

export function AddressesPage() {
  const {
    addresses,
    totalAddresses,
    form,
    search,
    loading,
    submitting,
    error,
    setSearch,
    updateField,
    submitAddress,
    removeAddress,
    refresh,
  } = useAddresses();

  return (
    <AppShell>
      <section className="addresses-page">
      <header className="addresses-page__header">
        <div>
          <h1>Endereços</h1>
          <p>
            Cadastre endereços mockados para validar a etapa que antecede a
            criação de ordens de serviço.
          </p>
          <p className="addresses-page__summary">
            {totalAddresses} endereço{totalAddresses === 1 ? "" : "s"} no
            ambiente de teste.
          </p>
        </div>

        <div className="addresses-page__header-actions">
          <Link to="/dashboard" className="addresses-page__back-link">
            Voltar ao dashboard
          </Link>
        </div>
      </header>

      <section className="addresses-page__content">
        <form
          className="address-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitAddress();
          }}
        >
          <div>
            <h2>Novo endereço</h2>
            <p>Dados salvos apenas no navegador para testes do MVP.</p>
          </div>

          {error ? (
            <p className="address-form__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="address-form__grid">
            <Input
              placeholder="Apelido"
              value={form.label}
              onChange={(event) => updateField("label", event.target.value)}
              disabled={submitting}
            />
            <Input
              placeholder="CEP"
              value={form.zipCode}
              onChange={(event) => updateField("zipCode", event.target.value)}
              disabled={submitting}
              inputMode="numeric"
            />
            <Input
              placeholder="Rua"
              value={form.street}
              onChange={(event) => updateField("street", event.target.value)}
              disabled={submitting}
            />
            <Input
              placeholder="Número"
              value={form.number}
              onChange={(event) => updateField("number", event.target.value)}
              disabled={submitting}
            />
            <Input
              placeholder="Complemento"
              value={form.complement}
              onChange={(event) =>
                updateField("complement", event.target.value)
              }
              disabled={submitting}
            />
            <Input
              placeholder="Bairro"
              value={form.neighborhood}
              onChange={(event) =>
                updateField("neighborhood", event.target.value)
              }
              disabled={submitting}
            />
            <Input
              placeholder="Cidade"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              disabled={submitting}
            />
            <Input
              placeholder="UF"
              value={form.state}
              onChange={(event) => updateField("state", event.target.value)}
              disabled={submitting}
              maxLength={2}
            />
          </div>

          <button
            type="submit"
            className="address-form__submit"
            disabled={submitting}
          >
            {submitting ? "Salvando..." : "Adicionar endereço"}
          </button>
        </form>

        <section className="addresses-list">
          <div className="addresses-list__toolbar">
            <Input
              placeholder="Buscar endereço"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={loading}
              aria-label="Buscar endereço"
            />
            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              disabled={loading}
            >
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {loading ? (
            <p className="addresses-list__state">Carregando endereços...</p>
          ) : addresses.length === 0 ? (
            <p className="addresses-list__state">
              Nenhum endereço encontrado.
            </p>
          ) : (
            <div className="addresses-list__items">
              {addresses.map((address) => (
                <article
                  className="address-card"
                  key={address.id}
                >
                  <div>
                    <strong>{address.label}</strong>
                    <p>
                      {address.street}, {address.number}
                      {address.complement ? ` - ${address.complement}` : ""}
                    </p>
                    <span>
                      {address.neighborhood}, {address.city} - {address.state}
                    </span>
                    <small>CEP {address.zipCode}</small>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void removeAddress(address.id);
                    }}
                  >
                    Remover
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
      </section>
    </AppShell>
  );
}
