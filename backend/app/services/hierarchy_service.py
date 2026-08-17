"""Builds the organization tree(s) purely from Employee ID / Reports To Employee ID.

Assumes the input has already passed validation_service (no duplicate/missing
IDs, no dangling manager references, no cycles) — this module does not
re-check those invariants, it just assembles the graph.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.models.employee import Employee, OrgNode


@dataclass
class HierarchyResult:
    forest: list[OrgNode]
    direct_reports: dict[str, list[str]]
    reporting_chain: dict[str, list[str]]  # employee_id -> ancestor ids, root-first, excluding self
    employees_by_id: dict[str, Employee]


def build_hierarchy(employees: list[Employee]) -> HierarchyResult:
    employees_by_id = {e.employee_id: e for e in employees if e.employee_id}

    direct_reports: dict[str, list[str]] = {}
    for e in employees:
        if e.employee_id and e.reports_to:
            direct_reports.setdefault(e.reports_to, []).append(e.employee_id)

    root_ids = [e.employee_id for e in employees if e.employee_id and not e.reports_to]

    reporting_chain: dict[str, list[str]] = {}
    for e in employees:
        if not e.employee_id:
            continue
        chain: list[str] = []
        current = e.reports_to
        seen: set[str] = set()
        while current and current in employees_by_id and current not in seen:
            chain.append(current)
            seen.add(current)
            current = employees_by_id[current].reports_to
        chain.reverse()
        reporting_chain[e.employee_id] = chain

    forest = [
        _build_node(root_id, employees_by_id, direct_reports, depth=0)
        for root_id in root_ids
    ]

    return HierarchyResult(
        forest=forest,
        direct_reports=direct_reports,
        reporting_chain=reporting_chain,
        employees_by_id=employees_by_id,
    )


def _build_node(
    employee_id: str,
    employees_by_id: dict[str, Employee],
    direct_reports: dict[str, list[str]],
    depth: int,
) -> OrgNode:
    node = OrgNode(employee=employees_by_id[employee_id], depth=depth)
    child_ids = direct_reports.get(employee_id, [])
    node.children = [
        _build_node(child_id, employees_by_id, direct_reports, depth + 1)
        for child_id in child_ids
        if child_id in employees_by_id
    ]
    node.subtree_size = 1 + sum(child.subtree_size for child in node.children)
    return node


def max_depth(forest: list[OrgNode]) -> int:
    def _depth(node: OrgNode) -> int:
        if not node.children:
            return node.depth
        return max(_depth(child) for child in node.children)

    if not forest:
        return 0
    return max(_depth(root) for root in forest) + 1
