from __future__ import annotations

from pydantic import BaseModel

from app.schemas.employee import EmployeeSchema, OrgNodeSchema
from app.schemas.validation import OrgSummary, ValidationResult


class UploadResponse(BaseModel):
    employees: list[EmployeeSchema] = []
    trees: list[OrgNodeSchema] = []
    summary: OrgSummary
    validation: ValidationResult
    chart_generated: bool
