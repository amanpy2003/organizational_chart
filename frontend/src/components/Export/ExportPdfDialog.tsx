import { useMemo, useState, type ReactNode } from "react";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { Checkbox } from "@/components/common/Checkbox";
import { useOrgStore } from "@/store/orgStore";
import { exportPdf, toBackendFields } from "@/services/api";
import { toast } from "@/store/toastStore";
import {
  scopeCurrentView,
  scopeDepartment,
  scopeEmployeeChain,
  scopeEmployeeSubtree,
  scopeEntireOrganization,
} from "@/utils/exportScope";
import { sortTreeByDepartment } from "@/utils/tree";
import type { ExportScope, PdfOrientation, PdfPageSize } from "@/types/chartConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCOPE_OPTIONS: { value: ExportScope; label: string }[] = [
  { value: "entire", label: "Entire Organization" },
  { value: "current-view", label: "Current View (respects collapsed teams)" },
  { value: "department", label: "Selected Department" },
  { value: "employee-subtree", label: "Selected Employee + Team Below" },
  { value: "employee-chain", label: "Selected Employee + Reporting Chain Above" },
];

const PAGE_SIZE_OPTIONS: { value: PdfPageSize; label: string }[] = [
  { value: "AUTO", label: "Auto (best fit)" },
  { value: "A4", label: "A4" },
  { value: "A3", label: "A3" },
  { value: "A2", label: "A2" },
  { value: "A1", label: "A1" },
  { value: "A0", label: "A0" },
];

export function ExportPdfDialog({ open, onOpenChange }: Props) {
  const trees = useOrgStore((s) => s.trees);
  const collapsedIds = useOrgStore((s) => s.collapsedIds);
  const selectedDepartments = useOrgStore((s) => s.selectedDepartments);
  const departmentNames = useOrgStore((s) => s.summary?.department_names ?? []);
  const selectedEmployeeId = useOrgStore((s) => s.selectedEmployeeId);
  const employees = useOrgStore((s) => s.employees);
  const chartConfig = useOrgStore((s) => s.chartConfig);

  const [scope, setScope] = useState<ExportScope>("entire");
  const [department, setDepartment] = useState<string>(departmentNames[0] ?? "");
  const [pageSize, setPageSize] = useState<PdfPageSize>("AUTO");
  const [orientation, setOrientation] = useState<PdfOrientation>("landscape");
  const [fitToOnePage, setFitToOnePage] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedEmployeeName = useMemo(
    () => employees.find((e) => e.employee_id === selectedEmployeeId)?.name,
    [employees, selectedEmployeeId]
  );

  const canExportSelectedEmployee = !!selectedEmployeeId;
  const canExportDepartment = departmentNames.length > 0;
  const requiresEmployeeSelection = scope === "employee-chain" || scope === "employee-subtree";

  const handleExport = async () => {
    let scopedTrees = trees;
    let scopeLabel = "Entire Organization";

    if (scope === "current-view") {
      scopedTrees = scopeCurrentView(trees, new Set(collapsedIds));
      scopeLabel = "Current View";
    } else if (scope === "department") {
      const dept = department || departmentNames[0];
      scopedTrees = scopeDepartment(trees, dept);
      scopeLabel = `Department: ${dept}`;
    } else if (scope === "employee-subtree") {
      if (!selectedEmployeeId) {
        toast.error("No employee selected", "Click an employee card first to export their team.");
        return;
      }
      scopedTrees = scopeEmployeeSubtree(trees, selectedEmployeeId);
      scopeLabel = `${selectedEmployeeName ?? "Employee"} + Team Below`;
    } else if (scope === "employee-chain") {
      if (!selectedEmployeeId) {
        toast.error("No employee selected", "Click an employee card first to export their reporting chain.");
        return;
      }
      scopedTrees = scopeEmployeeChain(trees, selectedEmployeeId);
      scopeLabel = `${selectedEmployeeName ?? "Employee"} + Reporting Chain`;
    } else {
      scopedTrees = scopeEntireOrganization(trees);
    }

    if (scopedTrees.length === 0) {
      toast.error("Nothing to export", "The selected scope has no employees.");
      return;
    }

    // Mirror the on-screen chart: department-grouped layout clusters each
    // manager's children by department before laying anything out.
    if (chartConfig.layout === "department") {
      scopedTrees = sortTreeByDepartment(scopedTrees);
    }

    const direction = chartConfig.layout === "horizontal" || chartConfig.layout === "compact"
      ? chartConfig.layout
      : "vertical";

    setBusy(true);
    try {
      await exportPdf({
        trees: scopedTrees,
        title: "Organization Chart",
        fields: toBackendFields(chartConfig.fields),
        direction,
        page_size: pageSize,
        orientation,
        scope_label: scopeLabel,
        fit_to_one_page: fitToOnePage,
      });
      toast.success("PDF exported", "Your organization chart has been downloaded.");
      onOpenChange(false);
    } catch (err) {
      toast.error("Export failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Export to PDF" description="The full hierarchy is redrawn server-side, so nothing gets clipped or missed." size="sm">
      <div className="space-y-4">
        <Field label="Export scope">
          <Select value={scope} onValueChange={setScope} options={SCOPE_OPTIONS} />
          {requiresEmployeeSelection && !canExportSelectedEmployee && (
            <p className="mt-1.5 text-xs text-amber-600">Select an employee on the chart first.</p>
          )}
          {scope === "department" && !canExportDepartment && (
            <p className="mt-1.5 text-xs text-amber-600">No departments detected in this dataset.</p>
          )}
        </Field>

        {scope === "department" && canExportDepartment && (
          <Field label="Department">
            <Select
              value={department || departmentNames[0]}
              onValueChange={setDepartment}
              options={departmentNames.map((d) => ({ value: d, label: d }))}
            />
          </Field>
        )}

        <Field label="Page size">
          <Select value={pageSize} onValueChange={setPageSize} options={PAGE_SIZE_OPTIONS} />
        </Field>

        <Field label="Orientation">
          <Select
            value={orientation}
            onValueChange={setOrientation}
            options={[
              { value: "landscape", label: "Landscape" },
              { value: "portrait", label: "Portrait" },
            ]}
          />
        </Field>

        <div className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5">
          <Checkbox
            id="fit-to-one-page"
            checked={fitToOnePage}
            onCheckedChange={setFitToOnePage}
            label="Fit entire chart onto a single page"
          />
          <p className="mt-1 pl-6 text-xs text-ink-500">
            Shrinks the whole chart to fit one sheet instead of splitting a large org across
            multiple pages. Cards and text get smaller as the organization grows.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={busy}
            onClick={handleExport}
            disabled={(requiresEmployeeSelection && !canExportSelectedEmployee) || (scope === "department" && !canExportDepartment)}
          >
            Export PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-500">{label}</label>
      {children}
    </div>
  );
}
