import { useState } from "react";
import { Network, Sparkles, ArrowRight, RotateCcw } from "lucide-react";

import { UploadDropzone } from "@/components/Upload/UploadDropzone";
import { TemplateDownloadButton } from "@/components/Upload/TemplateDownloadButton";
import { ValidationSummary } from "@/components/ValidationReport/ValidationSummary";
import { ErrorList } from "@/components/ValidationReport/ErrorList";
import { Button } from "@/components/common/Button";
import { useOrgStore } from "@/store/orgStore";
import { uploadOrganizationFile, ApiError } from "@/services/api";
import { toast } from "@/store/toastStore";

export function DashboardPage({ onOpenChart }: { onOpenChart: () => void }) {
  const [busy, setBusy] = useState(false);
  const summary = useOrgStore((s) => s.summary);
  const validation = useOrgStore((s) => s.validation);
  const chartGenerated = useOrgStore((s) => s.chartGenerated);
  const fileName = useOrgStore((s) => s.fileName);
  const setUploadResult = useOrgStore((s) => s.setUploadResult);
  const reset = useOrgStore((s) => s.reset);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const result = await uploadOrganizationFile(file);
      setUploadResult(result, file.name);
      if (result.chart_generated) {
        toast.success("File processed successfully", `${result.summary.employee_count} employees loaded.`);
      } else {
        toast.error("Data issues found", "Please review the errors below before generating the chart.");
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong while processing your file.";
      toast.error("Unable to process file", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto min-h-full max-w-4xl px-6 py-14">
      <header className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-panel">
          <Network size={24} />
        </div>
        <h1 className="text-2xl font-semibold text-ink-900">Organizational Chart Generator</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Upload your organization's Excel data and get a clean, interactive org chart in seconds —
          no manual boxes, no manual connectors.
        </p>
      </header>

      {!summary ? (
        <div className="space-y-4">
          <UploadDropzone onFileSelected={handleFile} busy={busy} />
          <div className="flex items-center justify-center gap-3">
            <TemplateDownloadButton />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StepCard step="1" title="Download the template" description="Get the pre-formatted Excel template with sample rows and instructions." />
            <StepCard step="2" title="Fill in your hierarchy" description="One row per employee. Reports-To Employee ID drives the whole structure." />
            <StepCard step="3" title="Upload & explore" description="We validate, build the hierarchy, and render an interactive chart automatically." />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
            <div className="flex items-center gap-2 text-sm text-ink-600">
              <Sparkles size={15} className="text-brand-500" />
              <span className="font-medium text-ink-900">{fileName}</span> processed
            </div>
            <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>
              Upload a different file
            </Button>
          </div>

          <ValidationSummary summary={summary} />
          {validation && <ErrorList validation={validation} />}

          <div className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-5 shadow-card">
            <div>
              <p className="text-sm font-medium text-ink-900">
                {chartGenerated ? "Your organization chart is ready." : "Chart generation is blocked."}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {chartGenerated
                  ? "Open the interactive chart to explore, search, filter and export."
                  : "Fix the data errors above in your Excel file and upload again."}
              </p>
            </div>
            <Button variant="primary" size="lg" disabled={!chartGenerated} onClick={onOpenChart} icon={<ArrowRight size={16} />}>
              Open Organizational Chart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
        {step}
      </span>
      <p className="mt-2.5 text-sm font-medium text-ink-800">{title}</p>
      <p className="mt-1 text-xs text-ink-500">{description}</p>
    </div>
  );
}
