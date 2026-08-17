from __future__ import annotations

from pydantic import BaseModel


class ValidationIssue(BaseModel):
    code: str
    message: str
    severity: str  # "error" | "warning"
    row_numbers: list[int] = []
    employee_ids: list[str] = []


class ValidationResult(BaseModel):
    errors: list[ValidationIssue] = []
    warnings: list[ValidationIssue] = []
    is_valid: bool = True

    @property
    def has_errors(self) -> bool:
        return len(self.errors) > 0


class OrgSummary(BaseModel):
    employee_count: int = 0
    department_count: int = 0
    department_names: list[str] = []
    level_count: int = 0
    top_level_count: int = 0
    manager_count: int = 0
    error_count: int = 0
    warning_count: int = 0
