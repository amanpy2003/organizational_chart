import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Layers, ChevronDown, Check } from "lucide-react";
import clsx from "clsx";

import { useOrgStore } from "@/store/orgStore";

export function LevelFilter() {
  const levelCount = useOrgStore((s) => s.summary?.level_count ?? 0);
  const maxDepth = useOrgStore((s) => s.maxDepth);
  const setMaxDepth = useOrgStore((s) => s.setMaxDepth);

  if (levelCount <= 1) return null;

  const options = Array.from({ length: levelCount }, (_, i) => i);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={clsx(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm shadow-sm",
            maxDepth !== null ? "border-brand-300 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
          )}
        >
          <Layers size={14} />
          Levels
          {maxDepth !== null && (
            <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
              1–{maxDepth + 1}
            </span>
          )}
          <ChevronDown size={13} className="text-ink-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 w-48 rounded-lg border border-ink-100 bg-white p-1.5 shadow-panel"
        >
          <DropdownMenu.Item
            onSelect={() => setMaxDepth(null)}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-ink-700 outline-none data-[highlighted]:bg-ink-50"
          >
            Show all levels
            {maxDepth === null && <Check size={14} className="text-brand-600" />}
          </DropdownMenu.Item>
          {options.map((depth) => (
            <DropdownMenu.Item
              key={depth}
              onSelect={() => setMaxDepth(depth)}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-ink-700 outline-none data-[highlighted]:bg-ink-50"
            >
              Up to level {depth + 1}
              {maxDepth === depth && <Check size={14} className="text-brand-600" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
