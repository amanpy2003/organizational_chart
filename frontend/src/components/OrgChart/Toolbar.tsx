import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronsDownUp,
  ChevronsUpDown,
  Settings2,
  ArrowLeft,
} from "lucide-react";

import { useOrgStore } from "@/store/orgStore";
import { Button } from "@/components/common/Button";
import { Tooltip } from "@/components/common/Tooltip";
import { Select } from "@/components/common/Select";
import { EmployeeSearch } from "@/components/Search/EmployeeSearch";
import { DepartmentFilter } from "@/components/Filters/DepartmentFilter";
import { LocationFilter } from "@/components/Filters/LocationFilter";
import { LevelFilter } from "@/components/Filters/LevelFilter";
import { ChartSettingsPanel } from "@/components/Settings/ChartSettingsPanel";
import { ExportMenu } from "@/components/Export/ExportMenu";
import type { LayoutMode } from "@/types/chartConfig";

const LAYOUT_OPTIONS: { value: LayoutMode; label: string }[] = [
  { value: "vertical", label: "Vertical (top-down)" },
  { value: "horizontal", label: "Horizontal (left-right)" },
  { value: "compact", label: "Compact" },
  { value: "department", label: "Department-grouped" },
];

export function ChartToolbar({ onBackToDashboard }: { onBackToDashboard: () => void }) {
  const summary = useOrgStore((s) => s.summary);
  const chartConfig = useOrgStore((s) => s.chartConfig);
  const updateChartConfig = useOrgStore((s) => s.updateChartConfig);
  const collapseAll = useOrgStore((s) => s.collapseAll);
  const expandAll = useOrgStore((s) => s.expandAll);
  const reactFlow = useReactFlow();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 border-b border-ink-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tooltip label="Back to dashboard">
            <button
              onClick={onBackToDashboard}
              aria-label="Back to dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
            >
              <ArrowLeft size={17} />
            </button>
          </Tooltip>
          <div>
            <h1 className="text-sm font-semibold text-ink-900">Organizational Chart</h1>
            {summary && (
              <p className="text-xs text-ink-500">
                {summary.employee_count} employees · {summary.department_count} departments ·{" "}
                {summary.level_count} levels
              </p>
            )}
          </div>
        </div>
        <ExportMenu />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <EmployeeSearch />
        <DepartmentFilter />
        <LocationFilter />
        <LevelFilter />
        <Select
          value={chartConfig.layout}
          onValueChange={(v) => updateChartConfig({ layout: v })}
          options={LAYOUT_OPTIONS}
          ariaLabel="Layout"
        />

        <div className="ml-auto flex items-center gap-1">
          <Tooltip label="Zoom out">
            <button
              onClick={() => reactFlow.zoomOut({ duration: 200 })}
              aria-label="Zoom out"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            >
              <ZoomOut size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Zoom in">
            <button
              onClick={() => reactFlow.zoomIn({ duration: 200 })}
              aria-label="Zoom in"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            >
              <ZoomIn size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Fit to screen">
            <button
              onClick={() => reactFlow.fitView({ padding: 0.2, duration: 300 })}
              aria-label="Fit to screen"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            >
              <Maximize2 size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Expand all">
            <button
              onClick={expandAll}
              aria-label="Expand all"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            >
              <ChevronsUpDown size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Collapse all">
            <button
              onClick={collapseAll}
              aria-label="Collapse all"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            >
              <ChevronsDownUp size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Chart settings">
            <Button variant="secondary" size="md" icon={<Settings2 size={15} />} onClick={() => setSettingsOpen(true)}>
              Settings
            </Button>
          </Tooltip>
        </div>
      </div>

      {settingsOpen && <ChartSettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </div>
  );
}
