import { useEffect, useRef, type ReactNode } from "react";

import "./styles.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: "small" | "medium" | "large";
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = "medium",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstFocusableRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      // Focus on first focusable element (usually close or first action button)
      firstFocusableRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDialogElement>
  ) => {
    if (event.target === dialogRef.current) {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal--${size}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="modal__content">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            ref={firstFocusableRef}
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar diálogo"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {actions && <div className="modal__footer">{actions}</div>}
      </div>
    </dialog>
  );
}
