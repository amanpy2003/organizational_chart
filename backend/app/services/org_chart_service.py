"""Decorates the raw hierarchy with everything the frontend chart layer needs:
department color assignment, org-wide summary stats, and serializable tree /
employee schemas. This is the seam between "data" and "visualization" —
nothing here knows about pixels, dagre, or React Flow.
"""
from __future__ import annotations

from app.models.employee import OrgNode
from app.schemas.employee import EmployeeSchema, OrgNodeSchema
from app.schemas.validation import OrgSummary, ValidationResult
from app.services.hierarchy_service import HierarchyResult, max_depth
from app.utils.colors import assign_department_colors


def build_chart_payload(
    hierarchy: HierarchyResult, validation: ValidationResult
) -> tuple[list[EmployeeSchema], list[OrgNodeSchema], OrgSummary]:
    employees = list(hierarchy.employees_by_id.values())

    department_names: list[str] = []
    for e in employees:
        dept = e.department.strip() if e.department else "Unassigned"
        if dept not in department_names:
            department_names.append(dept)
    color_by_department = assign_department_colors(department_names)

    employee_schemas: list[EmployeeSchema] = []
    for e in employees:
        dept = e.department.strip() if e.department else "Unassigned"
        manager = hierarchy.employees_by_id.get(e.reports_to) if e.reports_to else None
        employee_schemas.append(
            EmployeeSchema(
                row_number=e.row_number,
                employee_id=e.employee_id,
                name=e.name,
                designation=e.designation,
                department=e.department,
                reports_to=e.reports_to,
                location=e.location,
                email=e.email,
                level=e.level,
                employment_type=e.employment_type,
                status=e.status,
                manager_name=manager.name if manager else None,
                direct_report_ids=hierarchy.direct_reports.get(e.employee_id, []),
                reporting_chain=hierarchy.reporting_chain.get(e.employee_id, []),
                department_color=color_by_department.get(dept),
            )
        )

    trees = [
        _to_node_schema(root, color_by_department, hierarchy.direct_reports)
        for root in hierarchy.forest
    ]

    manager_ids = {e.reports_to for e in employees if e.reports_to}
    summary = OrgSummary(
        employee_count=len(employees),
        department_count=len(department_names),
        department_names=department_names,
        level_count=max_depth(hierarchy.forest),
        top_level_count=len(hierarchy.forest),
        manager_count=len(manager_ids),
        error_count=len(validation.errors),
        warning_count=len(validation.warnings),
    )

    return employee_schemas, trees, summary


def _to_node_schema(
    node: OrgNode,
    color_by_department: dict[str, str],
    direct_reports: dict[str, list[str]],
) -> OrgNodeSchema:
    e = node.employee
    dept = e.department.strip() if e.department else "Unassigned"
    return OrgNodeSchema(
        id=e.employee_id,
        name=e.name,
        designation=e.designation,
        department=e.department,
        location=e.location,
        email=e.email,
        employee_id=e.employee_id,
        employment_type=e.employment_type,
        status=e.status,
        level=e.level,
        department_color=color_by_department.get(dept),
        depth=node.depth,
        subtree_size=node.subtree_size,
        children=[
            _to_node_schema(child, color_by_department, direct_reports)
            for child in node.children
        ],
    )
