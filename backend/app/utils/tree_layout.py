"""Pure tree-layout math shared by pdf_service.

Independent bottom-up subtree-size / top-down centering layout (the same
family as Reingold-Tilford). Operates in an abstract "main axis" (the
sibling-spread axis) / "depth" space; pdf_service maps that into real x/y
canvas coordinates depending on chart direction (vertical vs horizontal).

Because a node's subtree always occupies exactly [center - width/2, center +
width/2] and children never spill outside their parent's allotted span,
sibling subtrees never overlap — which is what lets pdf_service later cut
pages only through the dead space between subtrees and guarantee no card is
ever clipped.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


class TreeNode(Protocol):
    id: str
    children: list["TreeNode"]


@dataclass
class LayoutResult:
    widths: dict[str, float] = field(default_factory=dict)
    centers: dict[str, float] = field(default_factory=dict)
    depths: dict[str, int] = field(default_factory=dict)


def compute_layout(
    roots: list[TreeNode], card_main_size: float, sibling_gap: float, tree_gap: float
) -> LayoutResult:
    result = LayoutResult()

    def compute_width(node: TreeNode) -> float:
        if not node.children:
            w = card_main_size
        else:
            child_total = sum(compute_width(c) for c in node.children)
            child_total += sibling_gap * (len(node.children) - 1)
            w = max(card_main_size, child_total)
        result.widths[node.id] = w
        return w

    def assign(node: TreeNode, left: float, depth: int) -> None:
        result.depths[node.id] = depth
        w = result.widths[node.id]
        if not node.children:
            center = left + w / 2
        else:
            cursor = left + (w - _children_span(node, result, sibling_gap)) / 2
            centers: list[float] = []
            for child in node.children:
                cw = result.widths[child.id]
                assign(child, cursor, depth + 1)
                centers.append(result.centers[child.id])
                cursor += cw + sibling_gap
            center = (centers[0] + centers[-1]) / 2
        result.centers[node.id] = center

    offset = 0.0
    for root in roots:
        compute_width(root)
        assign(root, offset, 0)
        offset += result.widths[root.id] + tree_gap

    return result


def _children_span(node: TreeNode, result: LayoutResult, sibling_gap: float) -> float:
    total = sum(result.widths[c.id] for c in node.children)
    total += sibling_gap * (len(node.children) - 1)
    return total


def compute_compact_layout(
    roots: list[TreeNode], card_main_size: float, sibling_gap: float, tree_gap: float
) -> LayoutResult:
    """Layout for the "compact" indented-list chart style: each node's
    children stack in a single column beneath/after it (mirroring the
    frontend's buildCompactListGraph) instead of spreading out side by side —
    so a wide fan-out grows tall and narrow rather than wide. `depths` here is
    the indent level (mapped to the depth/cross axis by the caller, same as
    the horizontal tree style); `centers` is each card's position along the
    main (sibling-stacking) axis; `widths` is the vertical space consumed by
    the node's whole subtree, used by the same tiling/band-splitting logic
    that handles the other layout styles.
    """
    result = LayoutResult()

    def place(node: TreeNode, depth: int, top: float) -> float:
        result.depths[node.id] = depth
        result.centers[node.id] = top + card_main_size / 2
        if not node.children:
            result.widths[node.id] = card_main_size
            return top + card_main_size

        cursor = top
        for i, child in enumerate(node.children):
            if i > 0:
                cursor += sibling_gap
            cursor = place(child, depth + 1, cursor)

        bottom = max(cursor, top + card_main_size)
        result.widths[node.id] = bottom - top
        return bottom

    offset = 0.0
    for root in roots:
        offset = place(root, 0, offset) + tree_gap

    return result
