"""Validates the raw Employee rows against the hierarchy business rules.

Only Employee ID / Reports To Employee ID are used to reason about structure.
Designation/Department/Name/Level are never consulted here.
"""
from __future__ import annotations

from app.models.employee import Employee
from app.schemas.validation import ValidationIssue, ValidationResult


def validate_employees(employees: list[Employee]) -> ValidationResult:
    errors: list[ValidationIssue] = []
    warnings: list[ValidationIssue] = []

    errors.extend(_check_missing_ids(employees))
    duplicate_ids = _check_duplicate_ids(employees, errors)
    errors.extend(_check_invalid_manager_refs(employees, duplicate_ids))

    # Circular-reference and root detection only make sense once IDs are
    # unique and references resolve, otherwise the graph itself is broken.
    if not errors:
        errors.extend(_check_circular_references(employees))

    if not errors:
        warnings.extend(_check_multiple_roots(employees))

    return ValidationResult(errors=errors, warnings=warnings, is_valid=len(errors) == 0)


def _check_missing_ids(employees: list[Employee]) -> list[ValidationIssue]:
    missing_rows = [e.row_number for e in employees if not e.employee_id]
    if not missing_rows:
        return []
    return [
        ValidationIssue(
            code="MISSING_EMPLOYEE_ID",
            message=(
                f"Employee ID is missing for row {missing_rows[0]}."
                if len(missing_rows) == 1
                else f"Employee ID is missing for {len(missing_rows)} rows."
            ),
            severity="error",
            row_numbers=missing_rows,
        )
    ]


def _check_duplicate_ids(
    employees: list[Employee], errors: list[ValidationIssue]
) -> set[str]:
    rows_by_id: dict[str, list[int]] = {}
    for e in employees:
        if not e.employee_id:
            continue
        rows_by_id.setdefault(e.employee_id, []).append(e.row_number)

    duplicates = {emp_id: rows for emp_id, rows in rows_by_id.items() if len(rows) > 1}
    for emp_id, rows in duplicates.items():
        errors.append(
            ValidationIssue(
                code="DUPLICATE_EMPLOYEE_ID",
                message=f"Duplicate Employee ID: {emp_id} (rows {', '.join(map(str, rows))}).",
                severity="error",
                row_numbers=rows,
                employee_ids=[emp_id],
            )
        )
    return set(duplicates.keys())


def _check_invalid_manager_refs(
    employees: list[Employee], duplicate_ids: set[str]
) -> list[ValidationIssue]:
    known_ids = {e.employee_id for e in employees if e.employee_id and e.employee_id not in duplicate_ids}
    issues: list[ValidationIssue] = []
    for e in employees:
        if not e.reports_to or e.employee_id in duplicate_ids:
            continue
        if e.reports_to not in known_ids and e.reports_to not in {
            emp.employee_id for emp in employees
        }:
            issues.append(
                ValidationIssue(
                    code="INVALID_MANAGER_REFERENCE",
                    message=(
                        f"Employee {e.employee_id} references a manager ({e.reports_to}) "
                        "that does not exist."
                    ),
                    severity="error",
                    row_numbers=[e.row_number],
                    employee_ids=[e.employee_id],
                )
            )
    return issues


def _check_circular_references(employees: list[Employee]) -> list[ValidationIssue]:
    manager_of: dict[str, str] = {
        e.employee_id: e.reports_to
        for e in employees
        if e.employee_id and e.reports_to
    }

    issues: list[ValidationIssue] = []
    visited: set[str] = set()

    for start_id in manager_of:
        if start_id in visited:
            continue

        path: list[str] = []
        path_set: set[str] = set()
        current = start_id
        while current is not None and current in manager_of and current not in visited:
            if current in path_set:
                cycle_start = path.index(current)
                cycle = path[cycle_start:] + [current]
                issues.append(
                    ValidationIssue(
                        code="CIRCULAR_REPORTING",
                        message=(
                            "Circular reporting relationship detected involving: "
                            + " -> ".join(cycle)
                            + "."
                        ),
                        severity="error",
                        employee_ids=list(dict.fromkeys(cycle)),
                    )
                )
                break
            path.append(current)
            path_set.add(current)
            current = manager_of.get(current)
        else:
            pass

        visited.update(path)

    return issues


def _check_multiple_roots(employees: list[Employee]) -> list[ValidationIssue]:
    roots = [e.employee_id for e in employees if e.employee_id and not e.reports_to]
    if len(roots) <= 1:
        return []
    return [
        ValidationIssue(
            code="MULTIPLE_TOP_LEVEL_EMPLOYEES",
            message=(
                f"{len(roots)} top-level employees detected (no Reports-To value). "
                "The chart will render as separate trees unless you pick a primary root."
            ),
            severity="warning",
            employee_ids=roots,
        )
    ]
