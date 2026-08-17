import { ReactFlowProvider } from "@xyflow/react";

import { ChartToolbar } from "@/components/OrgChart/Toolbar";
import { OrgChartCanvas } from "@/components/OrgChart/OrgChartCanvas";
import { EmployeeDetailsModal } from "@/components/EmployeeDetails/EmployeeDetailsModal";

export function ChartPage({ onBackToDashboard }: { onBackToDashboard: () => void }) {
  return (
    <ReactFlowProvider>
      <div className="flex h-full flex-col bg-ink-50">
        <ChartToolbar onBackToDashboard={onBackToDashboard} />
        <div className="relative flex-1">
          <OrgChartCanvas />
        </div>
      </div>
      <EmployeeDetailsModal />
    </ReactFlowProvider>
  );
}
