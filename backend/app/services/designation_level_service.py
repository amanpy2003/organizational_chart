"""Classifies employees into a fixed, granular designation hierarchy — 24
levels from Vice Chairman down to Retainer — independent of the reporting
hierarchy. Two employees at the same level are peers regardless of which
department they're in (e.g. two different "Manager" title holders both land
in Level 11), which is exactly why this exists alongside, not instead of,
the Employee-ID/Reports-To reporting tree.

Used to attach a designation_level to every employee/node (see
org_chart_service), which the frontend uses to arrange the chart in
"rank by designation" mode.
"""
from __future__ import annotations

import re

UNCLASSIFIED_LEVEL = 0
MAX_LEVEL = 24

LEVEL_LABELS: dict[int, str] = {
    1: "Vice Chairman",
    2: "COO / Deputy Chief Executive Officer",
    3: "Senior Vice President",
    4: "Vice President",
    5: "Assistant Vice President",
    6: "Senior General Manager",
    7: "General Manager",
    8: "Deputy General Manager",
    9: "Assistant General Manager",
    10: "Senior Manager",
    11: "Manager",
    12: "Deputy Manager",
    13: "Assistant Manager",
    14: "Senior Engineer",
    15: "Engineer",
    16: "Senior Executive",
    17: "Executive",
    18: "Senior Supervisor",
    19: "Supervisor",
    20: "Execution",
    21: "Senior Document Controller",
    22: "Management Trainee",
    23: "Graduate Trainee",
    24: "Retainer",
    UNCLASSIFIED_LEVEL: "Unclassified",
}

# Checked in order, first match wins — longer/more-qualified phrases MUST
# come before the shorter generic word they contain, e.g.:
#   - "Senior Vice President" / "Assistant Vice President" contain "Vice
#     President" as a contiguous substring, so both must be checked before
#     the bare "Vice President" (Level 4) rule.
#   - "Senior/Deputy/Assistant General Manager" all contain "General
#     Manager" as a contiguous substring, so those three must be checked
#     before bare "General Manager" (Level 7).
#   - Every "*Manager" level (6-13) contains the word "Manager", so the bare
#     "Manager" fallback (Level 11) is checked dead last among them.
#   - "Senior Engineer"/"Senior Executive"/"Senior Supervisor" must each be
#     checked before their own bare form, and "Deputy Chief Executive
#     Officer" (Level 2) must be checked before bare "Executive" (Level 17)
#     since it contains that word too.
# Word-boundary matching (see classify_designation) separately prevents
# acronym collisions like "vp" matching inside "svp"/"avp" — that's a
# different problem from the substring-superset ordering handled here.
_CLASSIFICATION_RULES: list[tuple[int, str]] = [
    (1, "vice chairman"),
    (2, "deputy chief executive officer"),
    (2, "deputy ceo"),
    (2, "chief operating officer"),
    (2, "coo"),
    (3, "senior vice president"),
    (3, "svp"),
    (5, "assistant vice president"),
    (5, "avp"),
    (4, "vice president"),
    (4, "vp"),
    (6, "senior general manager"),
    (6, "sgm"),
    (8, "deputy general manager"),
    (8, "dgm"),
    (9, "assistant general manager"),
    (9, "agm"),
    (7, "general manager"),
    (7, "gm"),
    (10, "senior manager"),
    (12, "deputy manager"),
    (13, "assistant manager"),
    (11, "manager"),
    (14, "senior engineer"),
    (16, "senior executive"),
    (18, "senior supervisor"),
    (21, "senior document controller"),
    (22, "management trainee"),
    (23, "graduate trainee"),
    (15, "engineer"),
    (17, "executive"),
    (19, "supervisor"),
    (20, "execution"),
    (24, "retainer"),
]

_COMPILED_RULES = [
    (level, re.compile(rf"\b{re.escape(phrase)}\b", re.IGNORECASE))
    for level, phrase in _CLASSIFICATION_RULES
]


def classify_designation(designation: str) -> int:
    """Returns the level number (1-24), or UNCLASSIFIED_LEVEL if the
    designation doesn't match any known keyword — never guessed."""
    text = (designation or "").strip()
    if not text:
        return UNCLASSIFIED_LEVEL
    for level, pattern in _COMPILED_RULES:
        if pattern.search(text):
            return level
    return UNCLASSIFIED_LEVEL
