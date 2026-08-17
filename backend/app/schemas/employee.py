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
    # 1 (Vice Chairman) through 8 (Supervisor/Trainee/Retainer), or 0 if the
    # designation didn't match any known keyword. See designation_level_service.
    designation_level: int = 0


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
    designation_level: int = 0
    depth: int = 0
    subtree_size: int = 0
    children: list["OrgNodeSchema"] = []


OrgNodeSchema.model_rebuild()
