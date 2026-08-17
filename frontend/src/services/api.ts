import type { OrgNode } from "@/types/employee";
import type { CardFieldVisibility, PdfOrientation, PdfPageSize } from "@/types/chartConfig";
import type { UploadResponse } from "@/types/upload";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // fall through to generic message
  }
  return `Request failed with status ${response.status}.`;
}

export async function uploadOrganizationFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }
  return response.json();
}

export function downloadTemplateUrl(): string {
  return `${API_BASE_URL}/template`;
}

export async function downloadTemplate(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/template`);
  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }
  const blob = await response.blob();
  triggerDownload(blob, "organization_chart_template.xlsx");
}

export interface PdfExportRequestBody {
  trees: OrgNode[];
  title: string;
  fields: {
    show_employee_id: boolean;
    show_designation: boolean;
    show_department: boolean;
    show_location: boolean;
    show_email: boolean;
  };
  direction: "vertical" | "horizontal" | "compact";
  page_size: PdfPageSize;
  orientation: PdfOrientation;
  scope_label?: string | null;
  fit_to_one_page?: boolean;
}

export function toBackendFields(fields: CardFieldVisibility): PdfExportRequestBody["fields"] {
  return {
    show_employee_id: fields.showEmployeeId,
    show_designation: fields.showDesignation,
    show_department: fields.showDepartment,
    show_location: fields.showLocation,
    show_email: fields.showEmail,
  };
}

export async function exportPdf(body: PdfExportRequestBody): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }
  const blob = await response.blob();
  triggerDownload(blob, "organization_chart.pdf");
}

export async function exportExcel(trees: OrgNode[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/export/excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trees, title: "Organization Export" }),
  });
  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }
  const blob = await response.blob();
  triggerDownload(blob, "organization_export.xlsx");
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
