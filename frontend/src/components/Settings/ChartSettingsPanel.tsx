import type { ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";

import { Modal } from "@/components/common/Modal";
import { Checkbox } from "@/components/common/Checkbox";
import { Select } from "@/components/common/Select";
import { useOrgStore } from "@/store/orgStore";
import type { AppearanceConfig } from "@/types/chartConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAB_CLASS =
  "rounded-lg px-3 py-1.5 text-sm font-medium text-ink-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700";

export function ChartSettingsPanel({ open, onOpenChange }: Props) {
  const chartConfig = useOrgStore((s) => s.chartConfig);
  const updateChartConfig = useOrgStore((s) => s.updateChartConfig);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Chart Settings" description="Customize how the organization chart is displayed." size="md">
      <Tabs.Root defaultValue="fields">
        <Tabs.List className="mb-4 flex gap-1 rounded-lg bg-ink-50 p-1">
          <Tabs.Trigger value="fields" className={TAB_CLASS}>
            Card Fields
          </Tabs.Trigger>
          <Tabs.Trigger value="appearance" className={TAB_CLASS}>
            Appearance
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="fields" className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Visible fields</p>
          <Checkbox
            id="f-name"
            checked
            disabled
            onCheckedChange={() => {}}
            label="Employee Name (always shown)"
          />
          <Checkbox
            id="f-designation"
            checked={chartConfig.fields.showDesignation}
            onCheckedChange={(v) => updateChartConfig({ fields: { ...chartConfig.fields, showDesignation: v } })}
            label="Designation"
          />
          <Checkbox
            id="f-department"
            checked={chartConfig.fields.showDepartment}
            onCheckedChange={(v) => updateChartConfig({ fields: { ...chartConfig.fields, showDepartment: v } })}
            label="Department"
          />
          <Checkbox
            id="f-id"
            checked={chartConfig.fields.showEmployeeId}
            onCheckedChange={(v) => updateChartConfig({ fields: { ...chartConfig.fields, showEmployeeId: v } })}
            label="Employee ID"
          />
          <Checkbox
            id="f-location"
            checked={chartConfig.fields.showLocation}
            onCheckedChange={(v) => updateChartConfig({ fields: { ...chartConfig.fields, showLocation: v } })}
            label="Location"
          />
          <Checkbox
            id="f-email"
            checked={chartConfig.fields.showEmail}
            onCheckedChange={(v) => updateChartConfig({ fields: { ...chartConfig.fields, showEmail: v } })}
            label="Email"
          />
        </Tabs.Content>

        <Tabs.Content value="appearance" className="space-y-4">
          <SettingRow label="Card size">
            <Select
              value={chartConfig.appearance.cardSize}
              onValueChange={(v) => setAppearance(updateChartConfig, chartConfig.appearance, { cardSize: v as AppearanceConfig["cardSize"] })}
              options={[
                { value: "compact", label: "Compact" },
                { value: "comfortable", label: "Comfortable" },
                { value: "spacious", label: "Spacious" },
              ]}
            />
          </SettingRow>
          <SettingRow label="Font size">
            <Select
              value={chartConfig.appearance.fontSize}
              onValueChange={(v) => setAppearance(updateChartConfig, chartConfig.appearance, { fontSize: v as AppearanceConfig["fontSize"] })}
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
            />
          </SettingRow>
          <SettingRow label="Connector style">
            <Select
              value={chartConfig.appearance.connectorStyle}
              onValueChange={(v) => setAppearance(updateChartConfig, chartConfig.appearance, { connectorStyle: v as AppearanceConfig["connectorStyle"] })}
              options={[
                { value: "orthogonal", label: "Orthogonal" },
                { value: "curved", label: "Curved" },
                { value: "straight", label: "Straight" },
              ]}
            />
          </SettingRow>
          <SettingRow label={`Level spacing (${chartConfig.appearance.levelSpacing}px)`}>
            <input
              type="range"
              min={50}
              max={180}
              step={10}
              value={chartConfig.appearance.levelSpacing}
              onChange={(e) => setAppearance(updateChartConfig, chartConfig.appearance, { levelSpacing: Number(e.target.value) })}
              className="w-40 accent-brand-600"
            />
          </SettingRow>
          <SettingRow label={`Sibling spacing (${chartConfig.appearance.siblingSpacing}px)`}>
            <input
              type="range"
              min={16}
              max={100}
              step={4}
              value={chartConfig.appearance.siblingSpacing}
              onChange={(e) => setAppearance(updateChartConfig, chartConfig.appearance, { siblingSpacing: Number(e.target.value) })}
              className="w-40 accent-brand-600"
            />
          </SettingRow>
          <div className="border-t border-ink-100 pt-3">
            <Checkbox
              id="dept-color"
              checked={chartConfig.appearance.departmentColorCoding}
              onCheckedChange={(v) => setAppearance(updateChartConfig, chartConfig.appearance, { departmentColorCoding: v })}
              label="Department color coding on cards"
            />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </Modal>
  );
}

function setAppearance(
  updateChartConfig: (patch: any) => void,
  current: AppearanceConfig,
  patch: Partial<AppearanceConfig>
) {
  updateChartConfig({ appearance: { ...current, ...patch } });
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={clsx("flex items-center justify-between gap-4")}>
      <span className="text-sm text-ink-700">{label}</span>
      {children}
    </div>
  );
}
