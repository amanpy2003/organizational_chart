import type { ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-50 rounded-md bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in"
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-ink-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
