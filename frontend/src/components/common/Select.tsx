import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function Select<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
  disabled,
}: SelectProps<T>) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => onValueChange(v as T)} disabled={disabled}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={clsx(
          className ??
            "inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-700 shadow-sm hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-brand-200",
          disabled && "cursor-not-allowed opacity-50 hover:bg-white"
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronDown size={14} className="text-ink-400" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-panel">
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm text-ink-700 outline-none data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={14} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
