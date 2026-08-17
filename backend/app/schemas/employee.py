from __future__ import annotations

from pydantic import BaseModel


class EmployeeSchema(BaseModel):
    row_number: int
    employee_id: str
    name: str
    designation: str = ""
    department: str = ""
    reports_to: str | None = None
    location: str = ""
    email: str = ""
    level: str = ""
    employment_type: str = ""
    status: str = ""

    manager_name: str | None = None
    direct_report_ids: list[str] = []
    reporting_chain: list[str] = []
    department_color: str | None = None


class OrgNodeSchema(BaseModel):
    """Recursive tree node consumed directly by the frontend chart layer."""

    id: str
    name: str
    designation: str = ""
    department: str = ""
    location: str = ""
    email: str = ""
    employee_id: str = ""
    employment_type: str = ""
    status: str = ""
    level: str = ""
    department_color: str | None = None
    depth: int = 0
    subtree_size: int = 0
    children: list["OrgNodeSchema"] = []


OrgNodeSchema.model_rebuild()
