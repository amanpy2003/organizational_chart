import { Users, Building2, Layers, Crown, UserCog, AlertTriangle, AlertCircle, type LucideIcon } from "lucide-react";
import clsx from "clsx";

import type { OrgSummary } from "@/types/validation";

type Tone = "ok" | "error" | "warning";

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
}

export function ValidationSummary({ summary }: { summary: OrgSummary }) {
  const stats: Stat[] = [
    { label: "Employees", value: summary.employee_count, icon: Users },
    { label: "Departments", value: summary.department_count, icon: Building2 },
    { label: "Hierarchy Levels", value: summary.level_count, icon: Layers },
    { label: "Top-Level Employees", value: summary.top_level_count, icon: Crown },
    { label: "Managers", value: summary.manager_count, icon: UserCog },
    {
      label: "Data Errors",
      value: summary.error_count,
      icon: AlertCircle,
      tone: summary.error_count > 0 ? "error" : "ok",
    },
    {
      label: "Warnings",
      value: summary.warning_count,
      icon: AlertTriangle,
      tone: summary.warning_count > 0 ? "warning" : "ok",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={clsx(
            "rounded-xl border bg-white p-4 shadow-card",
            stat.tone === "error" && "border-red-200 bg-red-50/50",
            stat.tone === "warning" && "border-amber-200 bg-amber-50/50",
            !stat.tone && "border-ink-100"
          )}
        >
          <div className="flex items-center gap-2 text-ink-400">
            <stat.icon size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">{stat.label}</span>
          </div>
          <p
            className={clsx(
              "mt-1.5 text-2xl font-semibold",
              stat.tone === "error" ? "text-red-600" : stat.tone === "warning" ? "text-amber-600" : "text-ink-900"
            )}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
