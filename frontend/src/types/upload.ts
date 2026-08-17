import type { Employee, OrgNode } from "./employee";
import type { OrgSummary, ValidationResult } from "./validation";

export interface UploadResponse {
  employees: Employee[];
  trees: OrgNode[];
  summary: OrgSummary;
  validation: ValidationResult;
  chart_generated: boolean;
}
