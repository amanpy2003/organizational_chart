import { useState } from "react";

import { DashboardPage } from "@/pages/DashboardPage";
import { ChartPage } from "@/pages/ChartPage";
import { ToastViewport } from "@/components/common/ToastViewport";
import { TooltipProvider } from "@/components/common/Tooltip";
import { useOrgStore } from "@/store/orgStore";

type Route = "dashboard" | "chart";

export default function App() {
  const [route, setRoute] = useState<Route>("dashboard");
  const chartGenerated = useOrgStore((s) => s.chartGenerated);

  const goToChart = () => {
    if (chartGenerated) setRoute("chart");
  };

  return (
    <TooltipProvider>
      <div className="h-screen w-screen overflow-hidden bg-ink-50">
        {route === "dashboard" && (
          <div className="h-full overflow-y-auto">
            <DashboardPage onOpenChart={goToChart} />
          </div>
        )}
        {route === "chart" && <ChartPage onBackToDashboard={() => setRoute("dashboard")} />}
      </div>
      <ToastViewport />
    </TooltipProvider>
  );
}
