import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models.employee import Employee  # noqa: E402

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "sample_data"


def make_employee(emp_id, name, reports_to=None, department="Corporate", designation="Manager", row=None):
    return Employee(
        row_number=row or 2,
        employee_id=emp_id,
        name=name,
        designation=designation,
        department=department,
        reports_to=reports_to,
    )


@pytest.fixture
def valid_chain_employees() -> list[Employee]:
    return [
        make_employee("E001", "Amit Sharma", None, row=2),
        make_employee("E002", "Rahul Verma", "E001", row=3),
        make_employee("E003", "Neha Singh", "E001", row=4),
        make_employee("E004", "Raj Kumar", "E002", row=5),
        make_employee("E005", "Ankit Jain", "E002", row=6),
        make_employee("E006", "Priya Mehta", "E003", row=7),
    ]


@pytest.fixture
def wide_manager_employees() -> list[Employee]:
    employees = [make_employee("E001", "CEO Person", None, row=2)]
    for i in range(2, 42):
        employees.append(make_employee(f"E{i:03d}", f"Direct Report {i}", "E001", row=i))
    return employees
