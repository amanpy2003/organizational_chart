from app.services.hierarchy_service import build_hierarchy, max_depth
from tests.conftest import make_employee


def test_builds_single_root_tree(valid_chain_employees):
    result = build_hierarchy(valid_chain_employees)
    assert len(result.forest) == 1
    root = result.forest[0]
    assert root.employee.employee_id == "E001"
    assert {c.employee.employee_id for c in root.children} == {"E002", "E003"}


def test_subtree_size_counts_all_descendants(valid_chain_employees):
    result = build_hierarchy(valid_chain_employees)
    root = result.forest[0]
    assert root.subtree_size == 6  # all employees including root


def test_direct_reports_map(valid_chain_employees):
    result = build_hierarchy(valid_chain_employees)
    assert set(result.direct_reports["E001"]) == {"E002", "E003"}
    assert set(result.direct_reports["E002"]) == {"E004", "E005"}
    assert "E004" not in result.direct_reports  # leaf, no reports


def test_reporting_chain_is_root_first(valid_chain_employees):
    result = build_hierarchy(valid_chain_employees)
    assert result.reporting_chain["E004"] == ["E001", "E002"]
    assert result.reporting_chain["E001"] == []


def test_wide_manager_all_children_present(wide_manager_employees):
    result = build_hierarchy(wide_manager_employees)
    root = result.forest[0]
    assert len(root.children) == 40
    assert root.subtree_size == 41


def test_multiple_roots_produce_forest():
    employees = [
        make_employee("E001", "A", None, row=2),
        make_employee("E002", "B", None, row=3),
        make_employee("E003", "C", "E001", row=4),
    ]
    result = build_hierarchy(employees)
    assert len(result.forest) == 2
    root_ids = {r.employee.employee_id for r in result.forest}
    assert root_ids == {"E001", "E002"}


def test_max_depth_deep_chain():
    employees = [make_employee("E001", "Root", None, row=2)]
    parent = "E001"
    for i in range(2, 12):
        emp_id = f"E{i:03d}"
        employees.append(make_employee(emp_id, f"Person {i}", parent, row=i))
        parent = emp_id
    result = build_hierarchy(employees)
    assert max_depth(result.forest) == 11
