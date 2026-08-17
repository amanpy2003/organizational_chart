from app.services.validation_service import validate_employees
from tests.conftest import make_employee


def test_valid_data_has_no_errors(valid_chain_employees):
    result = validate_employees(valid_chain_employees)
    assert result.is_valid
    assert result.errors == []


def test_missing_employee_id_is_error():
    employees = [
        make_employee("E001", "Amit Sharma", None, row=2),
        make_employee("", "No ID Person", "E001", row=3),
    ]
    result = validate_employees(employees)
    assert not result.is_valid
    codes = [e.code for e in result.errors]
    assert "MISSING_EMPLOYEE_ID" in codes
    assert result.errors[codes.index("MISSING_EMPLOYEE_ID")].row_numbers == [3]


def test_duplicate_employee_id_is_error():
    employees = [
        make_employee("E001", "Amit Sharma", None, row=2),
        make_employee("E002", "Rahul Verma", "E001", row=3),
        make_employee("E002", "Rahul Verma Duplicate", "E001", row=4),
    ]
    result = validate_employees(employees)
    assert not result.is_valid
    codes = [e.code for e in result.errors]
    assert "DUPLICATE_EMPLOYEE_ID" in codes
    dup = result.errors[codes.index("DUPLICATE_EMPLOYEE_ID")]
    assert dup.row_numbers == [3, 4]
    assert dup.employee_ids == ["E002"]


def test_invalid_manager_reference_is_error():
    employees = [
        make_employee("E001", "Amit Sharma", None, row=2),
        make_employee("E015", "Someone", "E999", row=3),
    ]
    result = validate_employees(employees)
    assert not result.is_valid
    codes = [e.code for e in result.errors]
    assert "INVALID_MANAGER_REFERENCE" in codes
    issue = result.errors[codes.index("INVALID_MANAGER_REFERENCE")]
    assert "E015" in issue.employee_ids
    assert "E999" in issue.message


def test_circular_reference_is_detected():
    employees = [
        make_employee("E001", "A", "E002", row=2),
        make_employee("E002", "B", "E003", row=3),
        make_employee("E003", "C", "E001", row=4),
    ]
    result = validate_employees(employees)
    assert not result.is_valid
    codes = [e.code for e in result.errors]
    assert "CIRCULAR_REPORTING" in codes
    issue = result.errors[codes.index("CIRCULAR_REPORTING")]
    assert {"E001", "E002", "E003"}.issubset(set(issue.employee_ids))


def test_self_reporting_is_circular():
    employees = [make_employee("E001", "A", "E001", row=2)]
    result = validate_employees(employees)
    assert not result.is_valid
    assert any(e.code == "CIRCULAR_REPORTING" for e in result.errors)


def test_multiple_roots_is_warning_not_error():
    employees = [
        make_employee("E001", "A", None, row=2),
        make_employee("E002", "B", None, row=3),
        make_employee("E003", "C", "E001", row=4),
    ]
    result = validate_employees(employees)
    assert result.is_valid
    assert result.errors == []
    assert len(result.warnings) == 1
    assert result.warnings[0].code == "MULTIPLE_TOP_LEVEL_EMPLOYEES"
    assert set(result.warnings[0].employee_ids) == {"E001", "E002"}


def test_single_root_has_no_warning(valid_chain_employees):
    result = validate_employees(valid_chain_employees)
    assert result.warnings == []


def test_wide_manager_is_valid(wide_manager_employees):
    result = validate_employees(wide_manager_employees)
    assert result.is_valid
    assert result.errors == []
