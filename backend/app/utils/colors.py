"""Deterministic department color assignment.

Colors are assigned by encounter order within a given dataset, never keyed to
a specific department name string — so nothing is hardcoded to "Finance" or
"Sales" etc. The palette itself is a fixed set of professional, muted tones
suitable for subtle card accents (not loud/cartoonish).
"""
from __future__ import annotations

PALETTE: list[str] = [
    "#2563EB",  # blue
    "#0D9488",  # teal
    "#7C3AED",  # violet
    "#D97706",  # amber
    "#DC2626",  # red
    "#059669",  # emerald
    "#4F46E5",  # indigo
    "#DB2777",  # pink
    "#0891B2",  # cyan
    "#65A30D",  # lime
    "#9333EA",  # purple
    "#EA580C",  # orange
]


def assign_department_colors(department_names: list[str]) -> dict[str, str]:
    """department_names should already be in first-seen order and de-duplicated."""
    return {
        name: PALETTE[idx % len(PALETTE)]
        for idx, name in enumerate(department_names)
    }
