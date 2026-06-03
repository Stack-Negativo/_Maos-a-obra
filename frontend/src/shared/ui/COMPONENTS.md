# UI Components — P0 (Acessibilidade & Validação)

## Label

Componente `<label>` com suporte a indicador de obrigatório.

**Uso:**
```tsx
import { Label, Input } from "@/shared/ui";

<Label htmlFor="email" required>
  Email
</Label>
<Input id="email" type="email" />
```

**Props:**
- `children` (ReactNode) — Texto do label
- `required` (boolean) — Mostra `*` em vermelho
- `htmlFor` (string) — ID do input associado
- Todas as props de `<label>` HTML

---

## ErrorMessage

Feedback estruturado com ícone e texto (não apenas cor).

**Uso:**
```tsx
import { ErrorMessage } from "@/shared/ui";

{error && <ErrorMessage>{error}</ErrorMessage>}
```

**Props:**
- `children` (ReactNode) — Mensagem de erro
- `id` (string) — ID para `aria-describedby` no input

**Características:**
- ✅ Ícone visual (⚠)
- ✅ Role="alert" para screen readers
- ✅ Cor de perigo com border

---

## Select

Dropdown wrapper com label, validação e error state.

**Uso:**
```tsx
import { Select, type SelectOption } from "@/shared/ui";

const specialties: SelectOption[] = [
  { value: "1", label: "Encanador" },
  { value: "2", label: "Eletricista" },
];

<Select
  id="specialty"
  label="Especialidade"
  options={specialties}
  placeholder="Selecione uma especialidade"
  required
  onChange={(e) => setSpecialty(e.target.value)}
  error={errors.specialty}
/>
```

**Props:**
- `label` (ReactNode) — Label do select
- `options` (SelectOption[]) — Array de `{ value, label, disabled? }`
- `placeholder` (string) — Texto inicial
- `required` (boolean) — Mostra `*` no label
- `error` (string) — Mensagem de erro
- `onChange` (callback) — Handler de mudança
- Todas as props de `<select>` HTML

**Características:**
- ✅ Label integrado
- ✅ Error state visual (border vermelha)
- ✅ Dropdown customizado
- ✅ aria-describedby automático
- ✅ Disabled state

---

## Modal

Diálogo acessível com focus trap e keyboard support.

**Uso:**
```tsx
import { Modal } from "@/shared/ui";
import { useState } from "react";

export function CancelOrderModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Cancelar Ordem</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirmar cancelamento"
        size="small"
        actions={
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => setIsOpen(false)}>Voltar</button>
            <button
              onClick={() => {
                handleCancel();
                setIsOpen(false);
              }}
              style={{ background: "var(--color-danger)" }}
            >
              Cancelar Ordem
            </button>
          </div>
        }
      >
        <p>Deseja realmente cancelar esta ordem?</p>
        <p>Esta ação não pode ser desfeita.</p>
      </Modal>
    </>
  );
}
```

**Props:**
- `isOpen` (boolean) — Controla visibilidade
- `onClose` (function) — Callback ao fechar
- `title` (string) — Título do modal
- `children` (ReactNode) — Conteúdo do modal
- `actions` (ReactNode) — Botões de ação (footer)
- `size` ("small" | "medium" | "large") — Tamanho

**Características:**
- ✅ Acessível (focus trap, ARIA, keyboard)
- ✅ ESC para fechar
- ✅ Click no backdrop para fechar
- ✅ Animações suaves
- ✅ 3 tamanhos pré-definidos
- ✅ Header com botão fechar (×)

---

## Exemplo Completo — Formulário com Validação

```tsx
import { useState } from "react";
import { Label, Input, Select, ErrorMessage, Modal } from "@/shared/ui";

export function OrderForm() {
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const specialties = [
    { value: "1", label: "Encanador" },
    { value: "2", label: "Eletricista" },
    { value: "3", label: "Pedreiro" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Título é obrigatório";
    if (!specialty) newErrors.specialty = "Selecione uma especialidade";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Show confirmation modal
    setIsConfirming(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <Label htmlFor="title" required>
            Título da Ordem
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Ex: Troca de chuveiro"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.title;
                  return next;
                });
              }
            }}
          />
          {errors.title && <ErrorMessage>{errors.title}</ErrorMessage>}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <Select
            id="specialty"
            label="Especialidade"
            options={specialties}
            placeholder="Selecione uma especialidade"
            required
            value={specialty}
            onChange={(e) => {
              setSpecialty(e.target.value);
              if (errors.specialty) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.specialty;
                  return next;
                });
              }
            }}
            error={errors.specialty}
          />
        </div>

        <button type="submit">Criar Ordem</button>
      </form>

      <Modal
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        title="Confirmar criação"
        size="small"
        actions={
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => setIsConfirming(false)}>Cancelar</button>
            <button
              onClick={() => {
                // Handle submit
                setIsConfirming(false);
              }}
              style={{ background: "var(--color-brand)" }}
            >
              Confirmar
            </button>
          </div>
        }
      >
        <p>
          <strong>Ordem:</strong> {title}
        </p>
        <p>
          <strong>Especialidade:</strong> {specialties.find((s) => s.value === specialty)?.label}
        </p>
        <p>Deseja continuar?</p>
      </Modal>
    </>
  );
}
```

---

## Testing & Validation

### WCAG 2.1 AA Compliance

- ✅ Labels associated com inputs via `htmlFor` / `id`
- ✅ Error messages com `role="alert"` + `aria-describedby`
- ✅ Modal com focus trap e keyboard handling
- ✅ Color + icon para feedback (não apenas cor)
- ✅ Sufficient contrast ratios

### Browser Testing

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (modal `<dialog>` API)

### Accessibility Testing

```bash
# Install Axe DevTools
# Run: axe.run() in console

# No WCAG errors should appear for:
- Label + Input combinations
- Select + ErrorMessage
- Modal interactions
```

---

## Integração em Formulários Existentes

Para refatorar formulários existentes:

1. **Login/Register:**
   ```tsx
   // Substituir <input placeholder="..."> por:
   <Label htmlFor="email" required>Email</Label>
   <Input id="email" type="email" aria-describedby={error ? "email-error" : undefined} />
   {error && <ErrorMessage id="email-error">{error}</ErrorMessage>}
   ```

2. **OrderForm:**
   ```tsx
   // Substituir <select> por:
   <Select label="Especialidade" options={specialties} error={errors.specialty} required />
   ```

3. **Confirmações:**
   ```tsx
   // Adicionar Modal para confirmações:
   <Modal isOpen={showConfirm} onClose={closeConfirm} title="Confirmar?" ... />
   ```

---

## Notes

- **Desktop only:** Componentes otimizados para desktop (≥1024px)
- **Design tokens:** Todos usam CSS variables (`--color-*`, `--shadow-*`, `--radius-*`)
- **No external deps:** Zero dependências externas (apenas React)
- **Fully typed:** TypeScript strict mode
