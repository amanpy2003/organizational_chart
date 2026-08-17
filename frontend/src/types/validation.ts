export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
  row_numbers: number[];
  employee_ids: string[];
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  is_valid: boolean;
}

export interface OrgSummary {
  employee_count: number;
  department_count: number;
  department_names: string[];
  level_count: number;
  top_level_count: number;
  manager_count: number;
  error_count: number;
  warning_count: number;
}
