import clsx from "clsx";
import { Mail, MapPin, ChevronDown, ChevronRight, Users } from "lucide-react";

import type { OrgNode } from "@/types/employee";
import type { AppearanceConfig, CardFieldVisibility } from "@/types/chartConfig";
import { tint } from "@/utils/colors";

interface EmployeeCardProps {
  node: OrgNode;
  fields: CardFieldVisibility;
  cardSize: AppearanceConfig["cardSize"];
  fontSize: AppearanceConfig["fontSize"];
  departmentColorCoding: boolean;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  hasHiddenChildren?: boolean;
  hiddenCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClick?: () => void;
  className?: string;
}

const FONT_SIZE_CLASSES: Record<AppearanceConfig["fontSize"], { name: string; body: string }> = {
  small: { name: "text-[12px]", body: "text-[10px]" },
  medium: { name: "text-[13px]", body: "text-[11px]" },
  large: { name: "text-[15px]", body: "text-[12.5px]" },
};

const CARD_PADDING: Record<AppearanceConfig["cardSize"], string> = {
  compact: "px-2.5 py-2",
  comfortable: "px-3.5 py-2.5",
  spacious: "px-4 py-3.5",
};

export function EmployeeCard({
  node,
  fields,
  cardSize,
  fontSize,
  departmentColorCoding,
  isDimmed,
  isHighlighted,
  hasHiddenChildren,
  hiddenCount,
  isCollapsed,
  onToggleCollapse,
  onClick,
  className,
}: EmployeeCardProps) {
  const fontClasses = FONT_SIZE_CLASSES[fontSize];
  const accent = departmentColorCoding ? node.department_color || "#2563EB" : "#94A3B8";

  return (
    <div
      className={clsx(
        "group relative w-full rounded-lg border bg-white shadow-card transition-all duration-150",
        isHighlighted ? "border-brand-500 ring-2 ring-brand-200" : "border-ink-200",
        isDimmed && "opacity-30",
        onClick && "cursor-pointer hover:shadow-panel hover:-translate-y-0.5",
        className
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
      onClick={onClick}
    >
      <div className={CARD_PADDING[cardSize]}>
        <p className={clsx(fontClasses.name, "font-semibold leading-tight text-ink-900 truncate")} title={node.name}>
          {node.name}
        </p>
        {fields.showDesignation && node.designation && (
          <p className={clsx(fontClasses.body, "mt-0.5 truncate text-ink-600")} title={node.designation}>
            {node.designation}
          </p>
        )}
        {fields.showDepartment && node.department && (
          <span
            className={clsx(fontClasses.body, "mt-1 inline-block rounded px-1.5 py-0.5 font-medium truncate max-w-full")}
            style={{ backgroundColor: tint(accent, 0.12), color: accent }}
            title={node.department}
          >
            {node.department}
          </span>
        )}
        {fields.showEmployeeId && (
          <p className={clsx(fontClasses.body, "mt-1 text-ink-400")}>ID: {node.employee_id}</p>
        )}
        {fields.showLocation && node.location && (
          <p className={clsx(fontClasses.body, "mt-1 flex items-center gap-1 text-ink-400 truncate")}>
            <MapPin size={11} className="shrink-0" /> {node.location}
          </p>
        )}
        {fields.showEmail && node.email && (
          <p className={clsx(fontClasses.body, "mt-1 flex items-center gap-1 text-ink-400 truncate")}>
            <Mail size={11} className="shrink-0" /> {node.email}
          </p>
        )}
      </div>

      {hasHiddenChildren !== undefined && hasHiddenChildren !== null && node.children.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          aria-label={isCollapsed ? `Expand team (${hiddenCount} hidden)` : "Collapse team"}
          className={clsx(
            "absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[10px] font-medium shadow-sm transition-colors",
            isCollapsed ? "border-brand-300 text-brand-700 hover:bg-brand-50" : "border-ink-200 text-ink-500 hover:bg-ink-50"
          )}
        >
          {isCollapsed ? (
            <>
              <Users size={10} />
              {hiddenCount}
              <ChevronRight size={10} />
            </>
          ) : (
            <ChevronDown size={10} />
          )}
        </button>
      )}
    </div>
  );
}
