from dataclasses import dataclass, field


@dataclass
class Employee:
    """Raw employee record parsed from Excel, one per row."""

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


@dataclass
class OrgNode:
    """A node in the constructed hierarchy tree, wrapping an Employee plus computed data."""

    employee: Employee
    children: list["OrgNode"] = field(default_factory=list)
    depth: int = 0
    subtree_size: int = 0
