import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ModalFrameProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/** Every dialog is a real Radix dialog: focus trap, Escape and ARIA come free. */
export function ModalFrame({
  title,
  description,
  onClose,
  children,
  wide = false,
}: ModalFrameProps) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-panel-border bg-panel text-foreground shadow-xl ${
            wide ? "w-[min(92vw,64rem)]" : "w-[min(92vw,34rem)]"
          }`}
        >
          <header className="flex items-start justify-between gap-4 border-b border-panel-border p-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="btn btn-small"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </Dialog.Close>
          </header>
          <div className="max-h-[calc(90dvh-5rem)] overflow-auto p-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
