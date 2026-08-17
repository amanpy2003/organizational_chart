import type { ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

interface MultiSelectFilterProps {
  icon: ReactNode;
  label: string;
  options: string[];
  /** null = everything selected (unfiltered), [] = nothing selected. */
  selected: string[] | null;
  onToggle: (value: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

/** A checked/unchecked square that is purely visual — the DropdownMenu.Item
 * wrapping it is the actual interactive control. An earlier version nested a
 * real interactive Checkbox (a <label>-wrapped <button>) inside the item;
 * clicking the label text made the browser's native label-activation
 * behavior dispatch a second synthetic click on the nested button, which
 * bubbled up to the item's onSelect again — toggling the value on and then
 * immediately back off in the same click. A non-interactive indicator can't
 * generate that second click. */
function CheckIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      className={clsx(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
        checked ? "border-brand-600 bg-brand-600" : "border-ink-300 bg-white"
      )}
    >
      {checked && <Check size={12} className="text-white" strokeWidth={3} />}
    </span>
  );
}

export function MultiSelectFilter({
  icon,
  label,
  options,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: MultiSelectFilterProps) {
  if (options.length <= 1) return null;

  const activeCount = selected ? selected.length : options.length;
  const isFiltered = selected !== null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={clsx(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm shadow-sm",
            isFiltered
              ? "border-brand-300 bg-brand-50 text-brand-700"
              : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
          )}
        >
          {icon}
          {label}
          {isFiltered && (
            <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown size={13} className="text-ink-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 max-h-80 w-64 overflow-y-auto rounded-lg border border-ink-100 bg-white p-2 shadow-panel"
        >
          <div className="flex items-center justify-between px-1.5 pb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</span>
            <div className="flex items-center gap-2">
              <button onClick={onSelectAll} className="text-xs font-medium text-brand-600 hover:underline">
                Select all
              </button>
              <button onClick={onDeselectAll} className="text-xs font-medium text-ink-500 hover:underline">
                Deselect all
              </button>
            </div>
          </div>
          {options.map((option) => {
            const checked = !selected || selected.includes(option);
            return (
              <DropdownMenu.Item
                key={option}
                onSelect={(e) => {
                  e.preventDefault();
                  onToggle(option);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-ink-700 outline-none data-[highlighted]:bg-ink-50"
              >
                <CheckIndicator checked={checked} />
                {option}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
