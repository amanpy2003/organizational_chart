import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useReactFlow } from "@xyflow/react";
import { Download, FileText, Image, FileSpreadsheet, ChevronDown } from "lucide-react";

import { Button } from "@/components/common/Button";
import { useOrgStore } from "@/store/orgStore";
import { exportExcel } from "@/services/api";
import { toast } from "@/store/toastStore";
import { exportChartImage } from "./exportImage";
import { ExportPdfDialog } from "./ExportPdfDialog";

export function ExportMenu() {
  const trees = useOrgStore((s) => s.trees);
  const reactFlow = useReactFlow();
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  const handleImageExport = async (format: "png" | "svg") => {
    try {
      await exportChartImage(reactFlow, format, `organization_chart.${format}`);
      toast.success(`${format.toUpperCase()} exported`);
    } catch (err) {
      toast.error("Export failed", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const handleExcelExport = async () => {
    try {
      await exportExcel(trees);
      toast.success("Excel data exported");
    } catch (err) {
      toast.error("Export failed", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="primary" icon={<Download size={15} />}>
            Export
            <ChevronDown size={14} />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 w-56 rounded-lg border border-ink-100 bg-white p-1.5 shadow-panel"
          >
            <DropdownMenu.Item
              onSelect={() => setPdfDialogOpen(true)}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-700 outline-none data-[highlighted]:bg-ink-50"
            >
              <FileText size={15} className="text-ink-400" /> Export as PDF
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => handleImageExport("png")}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-700 outline-none data-[highlighted]:bg-ink-50"
            >
              <Image size={15} className="text-ink-400" /> Export as PNG
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => handleImageExport("svg")}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-700 outline-none data-[highlighted]:bg-ink-50"
            >
              <Image size={15} className="text-ink-400" /> Export as SVG
            </DropdownMenu.Item>
            <div className="my-1 h-px bg-ink-100" />
            <DropdownMenu.Item
              onSelect={handleExcelExport}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-700 outline-none data-[highlighted]:bg-ink-50"
            >
              <FileSpreadsheet size={15} className="text-ink-400" /> Export Data as Excel
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ExportPdfDialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen} />
    </>
  );
}
