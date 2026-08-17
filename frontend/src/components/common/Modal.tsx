import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onOpenChange, title, description, children, size = "md" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content
          className={clsx(
            "fixed left-1/2 top-1/2 z-50 w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-panel focus:outline-none",
            "max-h-[85vh] flex flex-col",
            SIZE_CLASSES[size]
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-ink-900">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-0.5 text-sm text-ink-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
