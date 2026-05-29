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
    editingAddressId,
    error,
    setSearch,
    updateField,
    submitAddress,
    removeAddress,
    startEditingAddress,
    cancelEditingAddress,
    refresh,
  } = useAddresses();

  return (
    <AppShell>
      <section className="addresses-page">
        <header className="addresses-page__header">
          <div>
            <h1>Endereços</h1>
            <p>Cadastre seus locais de atendimento para agilizar novas solicitações.</p>
            <p className="addresses-page__summary">
              {totalAddresses} endereço{totalAddresses === 1 ? "" : "s"} no
              sistema.
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
              <h2>{editingAddressId ? "Editar endereço" : "Novo endereço"}</h2>
              <p>Use apelidos simples para encontrar o local rapidamente ao criar uma ordem.</p>
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
              {submitting
                ? "Salvando..."
                : editingAddressId
                  ? "Salvar alterações"
                  : "Adicionar endereço"}
            </button>
            {editingAddressId ? (
              <button
                type="button"
                className="address-form__submit"
                onClick={cancelEditingAddress}
                disabled={submitting}
              >
                Cancelar edição
              </button>
            ) : null}
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
                  <article className="address-card" key={address.id}>
                    <div>
                      <strong>{address.label}</strong>
                      <p>
                        {address.street}, {address.number}
                        {address.complement ? ` - ${address.complement}` : ""}
                      </p>
                      <span>
                        {address.neighborhood}, {address.city} -{" "}
                        {address.state}
                      </span>
                      <small>CEP {address.zipCode}</small>
                    </div>

                    <button
                      type="button"
                      onClick={() => startEditingAddress(address)}
                    >
                      Editar
                    </button>
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
