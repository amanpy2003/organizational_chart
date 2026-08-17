import pytest

from app.services.designation_level_service import UNCLASSIFIED_LEVEL, classify_designation
from app.services.hierarchy_service import build_hierarchy
from app.services.org_chart_service import build_chart_payload
from app.services.validation_service import validate_employees
from tests.conftest import make_employee


@pytest.mark.parametrize(
    "designation,expected_level",
    [
        # Level 1
        ("Vice Chairman", 1),
        # Level 2 — including the collision case: "executive" appears inside
        # this phrase but must NOT fall through to Level 17.
        ("COO", 2),
        ("Chief Operating Officer", 2),
        ("Deputy Chief Executive Officer", 2),
        ("Deputy CEO", 2),
        # Levels 3-5 — SVP/VP/AVP are now three DISTINCT levels, not one
        # grouped band. "Senior/Assistant Vice President" both contain "Vice
        # President" as a substring and must not collide with bare Level 4.
        ("SVP", 3),
        ("Senior Vice President", 3),
        ("VP", 4),
        ("VP Finance", 4),
        ("Vice President - Sales", 4),
        ("AVP", 5),
        ("Assistant Vice President", 5),
        # Levels 6-9 — the GM family, now four distinct levels. Each of
        # Senior/Deputy/Assistant General Manager contains "General Manager"
        # as a substring and must not collide with bare Level 7.
        ("SGM", 6),
        ("Senior General Manager", 6),
        ("GM", 7),
        ("General Manager", 7),
        ("DGM", 8),
        ("Deputy General Manager", 8),
        ("AGM", 9),
        ("Assistant General Manager", 9),
        # Levels 10-13 — the Manager family, now four distinct levels. Every
        # one of these contains the word "Manager", so ordering must resolve
        # each to its own specific level rather than all collapsing to the
        # bare "Manager" (11) fallback.
        ("Senior Manager", 10),
        ("Manager", 11),
        ("Project Manager", 11),  # bare "manager" fallback, qualifier doesn't matter
        ("Deputy Manager", 12),
        ("Assistant Manager", 13),
        ("Assistant Manager - HR", 13),
        # Levels 14-15 — Engineer family
        ("Senior Engineer", 14),
        ("Engineer", 15),
        # Levels 16-17 — Executive family
        ("Senior Executive", 16),
        ("Executive", 17),
        ("Executive Assistant", 17),
        # Levels 18-19 — Supervisor family
        ("Senior Supervisor", 18),
        ("Supervisor", 19),
        # Level 20 — distinct word, must not collide with Executive family
        ("Execution", 20),
        # Level 21
        ("Senior Document Controller", 21),
        # Levels 22-24
        ("Management Trainee", 22),
        ("Graduate Trainee", 23),
        ("Retainer", 24),
        # Unclassified — must never be silently guessed into a level
        ("", UNCLASSIFIED_LEVEL),
        ("Blockchain Ninja", UNCLASSIFIED_LEVEL),
        ("Data Scientist", UNCLASSIFIED_LEVEL),
        ("Document Controller", UNCLASSIFIED_LEVEL),  # only the "Senior" form is a known level
    ],
)
def test_classify_designation(designation, expected_level):
    assert classify_designation(designation) == expected_level


def test_classify_designation_is_case_insensitive():
    assert classify_designation("vice president") == 4
    assert classify_designation("VICE PRESIDENT") == 4


def test_acronym_word_boundary_does_not_false_positive():
    # "vp"/"gm" must not match as substrings of longer unrelated acronyms.
    assert classify_designation("SVP") == 3  # not misread as containing "vp" separately from the SVP rule
    assert classify_designation("EVP") == UNCLASSIFIED_LEVEL  # not in the given hierarchy at all


def test_execution_does_not_collide_with_executive_family():
    assert classify_designation("Execution") == 20
    assert classify_designation("Executive") == 17
    assert classify_designation("Senior Executive") == 16


def test_build_chart_payload_attaches_designation_level_to_employees_and_tree():
    employees = [
        make_employee("E001", "Chair", None, designation="Vice Chairman", row=2),
        make_employee("E002", "VP", "E001", designation="VP Finance", row=3),
        make_employee("E003", "Mgr", "E002", designation="Manager", row=4),
    ]
    validation = validate_employees(employees)
    assert not validation.has_errors

    hierarchy = build_hierarchy(employees)
    employee_schemas, trees, _ = build_chart_payload(hierarchy, validation)

    levels_by_id = {e.employee_id: e.designation_level for e in employee_schemas}
    assert levels_by_id == {"E001": 1, "E002": 4, "E003": 11}

    root = trees[0]
    assert root.designation_level == 1
    assert root.children[0].designation_level == 4
    assert root.children[0].children[0].designation_level == 11
