"""Reads the uploaded Organization Excel file into a list of raw Employee records.

Deliberately dumb: this module only knows how to turn spreadsheet rows into
Employee dataclasses. It does not validate business rules (that's
validation_service) and does not know about hierarchy (that's hierarchy_service).
"""
from __future__ import annotations

import io

import openpyxl

from app.models.employee import Employee

# Maps normalized header text -> Employee field name. Multiple aliases are
# accepted per column so a slightly-renamed template header still parses.
HEADER_ALIASES: dict[str, str] = {
    "employee id": "employee_id",
    "emp id": "employee_id",
    "id": "employee_id",
    "employee name": "name",
    "name": "name",
    "designation": "designation",
    "job title": "designation",
    "title": "designation",
    "department": "department",
    "function": "department",
    "reports to employee id": "reports_to",
    "reports to": "reports_to",
    "manager id": "reports_to",
    "manager employee id": "reports_to",
    "location": "location",
    "office location": "location",
    "email": "email",
    "email address": "email",
    "level": "level",
    "employment type": "employment_type",
    "status": "status",
}

REQUIRED_LOGICAL_COLUMNS = {"employee_id", "name"}


class ExcelParseError(Exception):
    """Raised when the file cannot be read as an organization spreadsheet at all."""


def _normalize_header(value: object) -> str:
    return str(value or "").strip().lower()


def _cell_str(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text.lower() == "none" else text


def parse_workbook(file_bytes: bytes, filename: str) -> list[Employee]:
    if filename.lower().endswith(".xls"):
        rows = _read_legacy_xls_rows(file_bytes, filename)
    else:
        rows = _read_xlsx_rows(file_bytes, filename)
    return _parse_rows(rows)


def _read_xlsx_rows(file_bytes: bytes, filename: str):
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True, read_only=True)
    except Exception as exc:  # noqa: BLE001 - surface as a friendly parse error
        raise ExcelParseError(
            f"Unable to read '{filename}'. Please ensure it is a valid .xlsx or .xls file."
        ) from exc
    sheet = workbook.worksheets[0]
    yield from sheet.iter_rows(values_only=True)
    workbook.close()


def _read_legacy_xls_rows(file_bytes: bytes, filename: str):
    try:
        import xlrd
    except ImportError as exc:  # pragma: no cover - optional legacy dependency
        raise ExcelParseError(
            "Legacy .xls files require the optional 'xlrd' package. Please save the file as "
            ".xlsx and re-upload."
        ) from exc
    try:
        workbook = xlrd.open_workbook(file_contents=file_bytes)
    except Exception as exc:  # noqa: BLE001
        raise ExcelParseError(
            f"Unable to read '{filename}'. Please ensure it is a valid .xlsx or .xls file."
        ) from exc
    sheet = workbook.sheet_by_index(0)
    for row_idx in range(sheet.nrows):
        yield tuple(sheet.row_values(row_idx))


def _parse_rows(rows) -> list[Employee]:
    rows = iter(rows)
    try:
        header_row = next(rows)
    except StopIteration as exc:
        raise ExcelParseError("The uploaded file is empty.") from exc

    column_map: dict[int, str] = {}
    for idx, header in enumerate(header_row):
        normalized = _normalize_header(header)
        field = HEADER_ALIASES.get(normalized)
        if field:
            column_map[idx] = field

    found_fields = set(column_map.values())
    missing = REQUIRED_LOGICAL_COLUMNS - found_fields
    if missing:
        raise ExcelParseError(
            "The uploaded file is missing required column(s): "
            + ", ".join(sorted(missing))
            + ". Please use the provided template."
        )

    employees: list[Employee] = []
    for row_offset, row in enumerate(rows, start=2):  # row 1 is the header
        if row is None or all(cell is None for cell in row):
            continue

        values: dict[str, str] = {}
        for idx, field in column_map.items():
            cell_value = row[idx] if idx < len(row) else None
            values[field] = _cell_str(cell_value)

        if not values.get("employee_id") and not values.get("name"):
            continue

        employees.append(
            Employee(
                row_number=row_offset,
                employee_id=values.get("employee_id", ""),
                name=values.get("name", ""),
                designation=values.get("designation", ""),
                department=values.get("department", ""),
                reports_to=values.get("reports_to") or None,
                location=values.get("location", ""),
                email=values.get("email", ""),
                level=values.get("level", ""),
                employment_type=values.get("employment_type", ""),
                status=values.get("status", ""),
            )
        )

    return employees
