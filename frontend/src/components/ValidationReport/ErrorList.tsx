import { AlertCircle, AlertTriangle, Download } from "lucide-react";

import type { ValidationResult } from "@/types/validation";
import { Button } from "@/components/common/Button";
import { triggerDownload } from "@/services/api";

export function ErrorList({ validation }: { validation: ValidationResult }) {
  const hasIssues = validation.errors.length > 0 || validation.warnings.length > 0;
  if (!hasIssues) return null;

  const downloadReport = () => {
    const lines: string[] = ["Organization Chart — Validation Report", ""];
    if (validation.errors.length > 0) {
      lines.push(`ERRORS (${validation.errors.length})`);
      validation.errors.forEach((e, i) => {
        lines.push(
          `${i + 1}. [${e.code}] ${e.message}${e.row_numbers.length ? ` (rows: ${e.row_numbers.join(", ")})` : ""}`
        );
      });
      lines.push("");
    }
    if (validation.warnings.length > 0) {
      lines.push(`WARNINGS (${validation.warnings.length})`);
      validation.warnings.forEach((w, i) => {
        lines.push(`${i + 1}. [${w.code}] ${w.message}`);
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    triggerDownload(blob, "validation_report.txt");
  };

  return (
    <div className="space-y-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Validation Details</h3>
        <Button variant="ghost" size="sm" icon={<Download size={13} />} onClick={downloadReport}>
          Download Report
        </Button>
      </div>

      {validation.errors.length > 0 && (
        <div className="space-y-1.5">
          {validation.errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <div>
                <p>{e.message}</p>
                {e.row_numbers.length > 0 && (
                  <p className="mt-0.5 text-xs text-red-500">Rows: {e.row_numbers.join(", ")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="space-y-1.5">
          {validation.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p>{w.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
