import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import clsx from "clsx";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onCheckedChange, label, id, disabled }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={clsx(
        "flex items-center gap-2 text-sm text-ink-700",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        className="flex h-4 w-4 items-center justify-center rounded border border-ink-300 bg-white data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600"
      >
        <CheckboxPrimitive.Indicator>
          <Check size={12} className="text-white" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label}
    </label>
  );
}
