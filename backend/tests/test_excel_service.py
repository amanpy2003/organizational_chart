import pytest

from app.services.excel_service import ExcelParseError, parse_workbook
from app.services.hierarchy_service import build_hierarchy, max_depth
from app.services.validation_service import validate_employees
from tests.conftest import SAMPLE_DIR


def _load(filename: str):
    path = SAMPLE_DIR / filename
    return parse_workbook(path.read_bytes(), filename)


def test_parses_valid_small_sample():
    employees = _load("valid_small_50.xlsx")
    assert len(employees) > 30
    ids = [e.employee_id for e in employees]
    assert len(ids) == len(set(ids))
    result = validate_employees(employees)
    assert result.is_valid, result.errors


def test_parses_large_sample_with_wide_and_deep_branches():
    employees = _load("valid_large_500.xlsx")
    assert len(employees) == 500
    result = validate_employees(employees)
    assert result.is_valid, result.errors

    hierarchy = build_hierarchy(employees)
    assert len(hierarchy.forest) == 1
    max_direct_reports = max(len(v) for v in hierarchy.direct_reports.values())
    assert max_direct_reports >= 35  # the deliberately wide manager
    assert max_depth(hierarchy.forest) >= 10  # the deliberately deep chain


def test_duplicate_ids_fixture_flagged():
    employees = _load("invalid_duplicate_ids.xlsx")
    result = validate_employees(employees)
    assert not result.is_valid
    assert any(e.code == "DUPLICATE_EMPLOYEE_ID" for e in result.errors)


def test_missing_ids_fixture_flagged():
    employees = _load("invalid_missing_ids.xlsx")
    result = validate_employees(employees)
    assert not result.is_valid
    assert any(e.code == "MISSING_EMPLOYEE_ID" for e in result.errors)


def test_invalid_manager_fixture_flagged():
    employees = _load("invalid_manager_reference.xlsx")
    result = validate_employees(employees)
    assert not result.is_valid
    assert any(e.code == "INVALID_MANAGER_REFERENCE" for e in result.errors)


def test_circular_fixture_flagged():
    employees = _load("invalid_circular_reference.xlsx")
    result = validate_employees(employees)
    assert not result.is_valid
    assert any(e.code == "CIRCULAR_REPORTING" for e in result.errors)


def test_multiple_roots_fixture_flagged_as_warning():
    employees = _load("invalid_multiple_roots.xlsx")
    result = validate_employees(employees)
    assert result.is_valid
    assert any(w.code == "MULTIPLE_TOP_LEVEL_EMPLOYEES" for w in result.warnings)


def test_rejects_non_excel_bytes():
    with pytest.raises(ExcelParseError):
        parse_workbook(b"not an excel file", "bad.xlsx")
