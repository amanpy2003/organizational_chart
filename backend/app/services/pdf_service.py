"""Renders an organization tree to a paginated PDF using ReportLab.

Deliberately does NOT screenshot the browser chart. It independently
recomputes a full tree layout from the tree JSON it's given (see
utils/tree_layout.py) and draws cards + connectors directly, so the export
always contains the complete hierarchy regardless of what was scrolled into
view on screen, and can be tiled across as many pages as a very large
organization needs without ever slicing a card in half.
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A0, A1, A2, A3, A4, landscape, portrait
from reportlab.lib.utils import ImageReader  # noqa: F401  (kept for future logo support)
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas as pdfcanvas

from app.schemas.employee import OrgNodeSchema
from app.schemas.export import CardFieldConfig
from app.utils.tree_layout import compute_compact_layout, compute_layout

CARD_WIDTH = 190.0
SIBLING_GAP = 26.0
TREE_GAP = 70.0
LEVEL_GAP = 56.0
MARGIN = 32.0
HEADER_HEIGHT = 46.0
FOOTER_HEIGHT = 18.0
ACCENT_BAR_WIDTH = 4.0
MAX_CUSTOM_PAGE_POINTS = 14400.0  # 200 inches, generous ceiling for oversized single-family pages

STANDARD_SIZES = {"A4": A4, "A3": A3, "A2": A2, "A1": A1, "A0": A0}
SIZE_ORDER = ["A4", "A3", "A2", "A1", "A0"]

NAME_FONT = "Helvetica-Bold"
BODY_FONT = "Helvetica"
NAME_SIZE = 10.5
BODY_SIZE = 8.0


@dataclass
class _Band:
    nodes: list[OrgNodeSchema]
    note: str | None = None
    # ids of nodes present in `nodes` only as a "continues onto this page"
    # anchor header — their descendants must NOT be walked from this entry
    # (those descendants appear as their own separate entries, in this band
    # or a later one), otherwise the same cards would be both mis-sized into
    # this band's extent and drawn twice.
    anchor_ids: set[str] = field(default_factory=set)


def generate_org_chart_pdf(
    trees: list[OrgNodeSchema],
    fields: CardFieldConfig,
    direction: str,
    page_size: str,
    orientation: str,
    title: str,
    scope_label: str | None,
    fit_to_one_page: bool = False,
) -> bytes:
    if not trees:
        raise ValueError("No employees to export.")

    id_to_node = _index_nodes(trees)
    card_height = _card_height(fields)
    # "compact" reuses the horizontal style's box/connector/pagination code —
    # its only difference is *how* centers/depths are computed (a stacked
    # list instead of a centered tree) — so it shares that axis convention.
    axis_style = "horizontal" if direction in ("horizontal", "compact") else "vertical"
    card_main_size = card_height if axis_style == "horizontal" else CARD_WIDTH

    if direction == "compact":
        layout = compute_compact_layout(trees, card_main_size, SIBLING_GAP, TREE_GAP)
    else:
        layout = compute_layout(trees, card_main_size, SIBLING_GAP, TREE_GAP)

    # The depth (cross) axis always advances by the full card extent along that
    # axis: card width for horizontal/compact charts (depth flows left-to-right),
    # card height for vertical charts (depth flows top-to-bottom).
    depth_step = (CARD_WIDTH if axis_style == "horizontal" else card_height) + LEVEL_GAP

    def canvas_box(node_id: str) -> tuple[float, float, float, float]:
        center = layout.centers[node_id]
        depth = layout.depths[node_id]
        if axis_style == "horizontal":
            x0 = depth * depth_step
            y0 = center - card_height / 2
            return x0, y0, x0 + CARD_WIDTH, y0 + card_height
        x0 = center - CARD_WIDTH / 2
        y0 = depth * depth_step
        return x0, y0, x0 + CARD_WIDTH, y0 + card_height

    boxes = {node_id: canvas_box(node_id) for node_id in layout.centers}
    canvas_w = max(b[2] for b in boxes.values())
    canvas_h = max(b[3] for b in boxes.values())

    segments = _build_segments(trees, id_to_node, boxes, axis_style, card_height)

    if fit_to_one_page:
        return _render_single_scaled_page(
            id_to_node, boxes, segments, fields, page_size, orientation, title, scope_label,
            canvas_w, canvas_h,
        )

    page_w, page_h, tiled = _choose_page_size(canvas_w, canvas_h, page_size, orientation)
    content_w = page_w - 2 * MARGIN
    content_h = page_h - 2 * MARGIN - HEADER_HEIGHT - FOOTER_HEIGHT

    if axis_style == "horizontal":
        max_main, max_cross = content_h, content_w
    else:
        max_main, max_cross = content_w, content_h

    main_bands = _split_main_bands(trees, layout.widths, max_main) if tiled else [
        _Band(nodes=trees, note=None)
    ]
    cross_card_size = CARD_WIDTH if axis_style == "horizontal" else card_height
    cross_bands = (
        _split_cross_bands(sorted(set(layout.depths.values())), depth_step, cross_card_size, max_cross)
        if tiled
        else [(0.0, canvas_h)]
    )

    buffer = io.BytesIO()
    c = pdfcanvas.Canvas(buffer, pagesize=(page_w, page_h))

    total_pages = len(main_bands) * len(cross_bands)
    page_num = 0
    generated_at = datetime.now().strftime("%d %b %Y, %I:%M %p")

    for row_idx, (cross0, cross1) in enumerate(cross_bands):
        for col_idx, band in enumerate(main_bands):
            page_num += 1
            main0, main1 = _band_main_range(band, boxes, axis_style)
            _draw_page(
                c,
                page_w,
                page_h,
                title,
                scope_label,
                page_num,
                total_pages,
                row_idx,
                col_idx,
                len(cross_bands),
                len(main_bands),
                band.note,
                generated_at,
            )
            band_ids = {n.id for n in _flatten_band(band)}
            origin = (main0, cross0) if axis_style != "horizontal" else (cross0, main0)
            content_origin_y = page_h - MARGIN - HEADER_HEIGHT

            for node_id, box in boxes.items():
                if node_id not in band_ids:
                    continue
                bx0, by0, bx1, by1 = box
                cx_check = (bx0 + bx1) / 2
                cy_check = (by0 + by1) / 2
                in_main = (main0 - 0.01) <= (cy_check if axis_style == "horizontal" else cx_check) <= (main1 + 0.01)
                in_cross = (cross0 - 0.01) <= (cx_check if axis_style == "horizontal" else cy_check) <= (cross1 + 0.01)
                if not (in_main and in_cross):
                    continue
                node = id_to_node[node_id]
                px0 = MARGIN + (bx0 - origin[0])
                py0 = content_origin_y - (by1 - origin[1])
                _draw_card(c, node, fields, px0, py0, CARD_WIDTH, card_height)

            rect = (
                origin[0],
                origin[1],
                origin[0] + (main1 - main0 if axis_style != "horizontal" else cross1 - cross0),
                origin[1] + (cross1 - cross0 if axis_style != "horizontal" else main1 - main0),
            )
            for seg in segments:
                clipped = _clip_segment(seg, rect)
                if clipped is None:
                    continue
                (sx1, sy1), (sx2, sy2) = clipped
                px1 = MARGIN + (sx1 - origin[0])
                py1 = content_origin_y - (sy1 - origin[1])
                px2 = MARGIN + (sx2 - origin[0])
                py2 = content_origin_y - (sy2 - origin[1])
                c.setStrokeColor(colors.HexColor("#94A3B8"))
                c.setLineWidth(1.1)
                c.line(px1, py1, px2, py2)

            c.showPage()

    c.save()
    return buffer.getvalue()


MIN_SINGLE_PAGE_SCALE = 0.02


def _render_single_scaled_page(
    id_to_node: dict[str, OrgNodeSchema],
    boxes: dict[str, tuple[float, float, float, float]],
    segments: list[tuple[tuple[float, float], tuple[float, float]]],
    fields: CardFieldConfig,
    page_size: str,
    orientation: str,
    title: str,
    scope_label: str | None,
    canvas_w: float,
    canvas_h: float,
) -> bytes:
    """Forces the entire chart onto exactly one page by uniformly shrinking
    everything (cards, text, connectors) to fit, instead of tiling across
    multiple pages. Requested explicitly — for a large org this can make text
    very small, but guarantees a single sheet.
    """
    orient_fn = landscape if orientation == "landscape" else portrait
    # AUTO defaults to the largest standard size here (rather than the
    # smallest, as in the tiled path) so a single page stays as legible as
    # possible before the scale-down even kicks in.
    size_name = page_size if page_size != "AUTO" else "A0"
    page_w, page_h = orient_fn(STANDARD_SIZES[size_name])

    content_w = page_w - 2 * MARGIN
    content_h = page_h - 2 * MARGIN - HEADER_HEIGHT - FOOTER_HEIGHT
    scale = min(1.0, content_w / canvas_w, content_h / canvas_h)
    scale = max(scale, MIN_SINGLE_PAGE_SCALE)

    buffer = io.BytesIO()
    c = pdfcanvas.Canvas(buffer, pagesize=(page_w, page_h))
    generated_at = datetime.now().strftime("%d %b %Y, %I:%M %p")
    _draw_page(c, page_w, page_h, title, scope_label, 1, 1, 0, 0, 1, 1, None, generated_at)

    card_height = _card_height(fields)
    content_origin_y = page_h - MARGIN - HEADER_HEIGHT

    c.saveState()
    c.translate(MARGIN, content_origin_y)
    c.scale(scale, scale)

    for node_id, (bx0, _by0, _bx1, by1) in boxes.items():
        _draw_card(c, id_to_node[node_id], fields, bx0, -by1, CARD_WIDTH, card_height)

    c.setStrokeColor(colors.HexColor("#94A3B8"))
    c.setLineWidth(1.1)
    for (sx1, sy1), (sx2, sy2) in segments:
        c.line(sx1, -sy1, sx2, -sy2)

    c.restoreState()
    c.showPage()
    c.save()
    return buffer.getvalue()


def _index_nodes(trees: list[OrgNodeSchema]) -> dict[str, OrgNodeSchema]:
    out: dict[str, OrgNodeSchema] = {}

    def walk(node: OrgNodeSchema) -> None:
        out[node.id] = node
        for child in node.children:
            walk(child)

    for t in trees:
        walk(t)
    return out


def _card_height(fields: CardFieldConfig) -> float:
    extra_lines = sum(
        [
            fields.show_designation,
            fields.show_department,
            fields.show_employee_id,
            fields.show_location,
            fields.show_email,
        ]
    )
    return 30.0 + extra_lines * 12.0


def _build_segments(
    trees: list[OrgNodeSchema],
    id_to_node: dict[str, OrgNodeSchema],
    boxes: dict[str, tuple[float, float, float, float]],
    axis_style: str,
    card_height: float,
) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    segments: list[tuple[tuple[float, float], tuple[float, float]]] = []

    def walk(node: OrgNodeSchema) -> None:
        if node.children:
            px0, py0, px1, py1 = boxes[node.id]
            if axis_style == "horizontal":
                p_edge = ((px1, (py0 + py1) / 2))
                child_edges = [boxes[c.id] for c in node.children]
                bus_x = px1 + LEVEL_GAP / 2
                segments.append((p_edge, (bus_x, p_edge[1])))
                ys = [((cy0 + cy1) / 2) for cx0, cy0, cx1, cy1 in child_edges]
                segments.append(((bus_x, min(ys)), (bus_x, max(ys))))
                for (cx0, cy0, cx1, cy1) in child_edges:
                    cy = (cy0 + cy1) / 2
                    segments.append(((bus_x, cy), (cx0, cy)))
            else:
                p_edge = (((px0 + px1) / 2, py1))
                child_edges = [boxes[c.id] for c in node.children]
                bus_y = py1 + LEVEL_GAP / 2
                segments.append((p_edge, (p_edge[0], bus_y)))
                xs = [((cx0 + cx1) / 2) for cx0, cy0, cx1, cy1 in child_edges]
                segments.append(((min(xs), bus_y), (max(xs), bus_y)))
                for (cx0, cy0, cx1, cy1) in child_edges:
                    cx = (cx0 + cx1) / 2
                    segments.append(((cx, bus_y), (cx, cy0)))
        for child in node.children:
            walk(child)

    for t in trees:
        walk(t)
    return segments


def _clip_segment(
    seg: tuple[tuple[float, float], tuple[float, float]], rect: tuple[float, float, float, float]
) -> tuple[tuple[float, float], tuple[float, float]] | None:
    (x1, y1), (x2, y2) = seg
    rx0, ry0, rx1, ry1 = rect

    if x1 == x2:  # vertical segment
        x = x1
        if x < rx0 - 0.01 or x > rx1 + 0.01:
            return None
        lo, hi = sorted((y1, y2))
        lo, hi = max(lo, ry0), min(hi, ry1)
        if lo > hi:
            return None
        return (x, lo), (x, hi)

    if y1 == y2:  # horizontal segment
        y = y1
        if y < ry0 - 0.01 or y > ry1 + 0.01:
            return None
        lo, hi = sorted((x1, x2))
        lo, hi = max(lo, rx0), min(hi, rx1)
        if lo > hi:
            return None
        return (lo, y), (hi, y)

    return None  # only orthogonal segments are ever produced


def _choose_page_size(
    canvas_w: float, canvas_h: float, page_size: str, orientation: str
) -> tuple[float, float, bool]:
    orient_fn = landscape if orientation == "landscape" else portrait

    def fits(size_name: str) -> tuple[float, float] | None:
        w, h = orient_fn(STANDARD_SIZES[size_name])
        cw, ch = w - 2 * MARGIN, h - 2 * MARGIN - HEADER_HEIGHT - FOOTER_HEIGHT
        if canvas_w <= cw and canvas_h <= ch:
            return w, h
        return None

    if page_size != "AUTO":
        result = fits(page_size)
        if result:
            return result[0], result[1], False
        w, h = orient_fn(STANDARD_SIZES[page_size])
        return w, h, True

    for size_name in SIZE_ORDER:
        result = fits(size_name)
        if result:
            return result[0], result[1], False

    w, h = orient_fn(A0)
    return w, h, True


def _split_main_bands(
    nodes: list[OrgNodeSchema], widths: dict[str, float], max_main: float
) -> list[_Band]:
    bands: list[_Band] = []
    current: list[OrgNodeSchema] = []
    current_w = 0.0

    def flush() -> None:
        nonlocal current, current_w
        if current:
            bands.append(_Band(nodes=current))
        current, current_w = [], 0.0

    for node in nodes:
        w = widths[node.id]
        if w > max_main:
            flush()
            if not node.children:
                bands.append(_Band(nodes=[node]))
                continue
            sub_bands = _split_main_bands(node.children, widths, max_main)
            if sub_bands:
                sub_bands[0].nodes = [node] + sub_bands[0].nodes
                sub_bands[0].anchor_ids.add(node.id)
            for i, sb in enumerate(sub_bands):
                if len(sub_bands) > 1:
                    sb.note = f"{node.name}'s team — part {i + 1} of {len(sub_bands)}"
                bands.append(sb)
            continue

        addition = w if not current else w + SIBLING_GAP
        if current and current_w + addition > max_main:
            flush()
            addition = w
        current.append(node)
        current_w += addition

    flush()
    return bands or [_Band(nodes=nodes)]


def _flatten_band(band: _Band) -> list[OrgNodeSchema]:
    out: list[OrgNodeSchema] = []

    def walk(node: OrgNodeSchema, is_anchor: bool) -> None:
        out.append(node)
        if is_anchor:
            # This entry is only a "continues here" header card — its
            # descendants are listed as their own separate entries (in this
            # band or a later one), so don't walk them again from here.
            return
        for child in node.children:
            walk(child, False)

    for n in band.nodes:
        walk(n, n.id in band.anchor_ids)
    return out


def _band_main_range(
    band: _Band, boxes: dict[str, tuple[float, float, float, float]], axis_style: str
) -> tuple[float, float]:
    """The band's true occupied extent along the main (sibling-spread) axis,
    read directly from the already-computed card boxes of every node in the
    band — NOT derived from center ± width/2, which only holds for leaves.
    An internal node's own center is the average of its children's centers
    (correct for drawing that parent's card), but for an asymmetric subtree
    that average is not the true midpoint of the space its descendants
    occupy, so using it here would misplace the page origin and clip cards.
    """
    los: list[float] = []
    his: list[float] = []
    for n in _flatten_band(band):
        bx0, by0, bx1, by1 = boxes[n.id]
        if axis_style == "horizontal":
            los.append(by0)
            his.append(by1)
        else:
            los.append(bx0)
            his.append(bx1)
    return min(los), max(his)


def _split_cross_bands(
    depths: list[int], depth_step: float, card_height: float, max_cross: float
) -> list[tuple[float, float]]:
    if not depths:
        return [(0.0, card_height)]
    bands: list[tuple[float, float]] = []
    start_depth = depths[0]
    for i in range(1, len(depths) + 1):
        span = (depths[i - 1] - start_depth + 1) * depth_step
        is_last = i == len(depths)
        next_span = (depths[i] - start_depth + 1) * depth_step if not is_last else None
        if is_last or (next_span is not None and next_span > max_cross):
            band_start = start_depth * depth_step
            band_end = depths[i - 1] * depth_step + card_height
            bands.append((band_start, band_end))
            if not is_last:
                start_depth = depths[i]
    return bands


def _draw_page(
    c: pdfcanvas.Canvas,
    page_w: float,
    page_h: float,
    title: str,
    scope_label: str | None,
    page_num: int,
    total_pages: int,
    row_idx: int,
    col_idx: int,
    total_rows: int,
    total_cols: int,
    band_note: str | None,
    generated_at: str,
) -> None:
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont(NAME_FONT, 14)
    c.drawString(MARGIN, page_h - MARGIN - 16, title)

    c.setFont(BODY_FONT, 8.5)
    c.setFillColor(colors.HexColor("#64748B"))
    subtitle_parts = []
    if scope_label:
        subtitle_parts.append(scope_label)
    if total_pages > 1:
        subtitle_parts.append(
            f"Page {page_num} of {total_pages} (row {row_idx + 1}/{total_rows}, column {col_idx + 1}/{total_cols})"
        )
    if band_note:
        subtitle_parts.append(band_note)
    c.drawString(MARGIN, page_h - MARGIN - 30, "  •  ".join(subtitle_parts))

    c.setStrokeColor(colors.HexColor("#E2E8F0"))
    c.setLineWidth(0.75)
    c.line(MARGIN, page_h - MARGIN - HEADER_HEIGHT + 8, page_w - MARGIN, page_h - MARGIN - HEADER_HEIGHT + 8)

    c.setFont(BODY_FONT, 7.5)
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.drawString(MARGIN, MARGIN - 4, f"Generated {generated_at}")
    c.drawRightString(page_w - MARGIN, MARGIN - 4, f"Page {page_num} of {total_pages}")


def _draw_card(
    c: pdfcanvas.Canvas,
    node: OrgNodeSchema,
    fields: CardFieldConfig,
    x: float,
    y: float,
    w: float,
    h: float,
) -> None:
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor("#CBD5E1"))
    c.setLineWidth(0.9)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=1)

    accent = node.department_color or "#2563EB"
    c.setFillColor(colors.HexColor(accent))
    c.roundRect(x, y, ACCENT_BAR_WIDTH, h, 2, fill=1, stroke=0)

    text_x = x + ACCENT_BAR_WIDTH + 10
    max_text_w = w - ACCENT_BAR_WIDTH - 18
    cursor_y = y + h - 16

    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont(NAME_FONT, NAME_SIZE)
    c.drawString(text_x, cursor_y, _truncate(node.name, NAME_FONT, NAME_SIZE, max_text_w))
    cursor_y -= 13

    c.setFont(BODY_FONT, BODY_SIZE)
    c.setFillColor(colors.HexColor("#475569"))

    lines: list[str] = []
    if fields.show_designation and node.designation:
        lines.append(node.designation)
    if fields.show_department and node.department:
        lines.append(node.department)
    if fields.show_employee_id and node.employee_id:
        lines.append(f"ID: {node.employee_id}")
    if fields.show_location and node.location:
        lines.append(node.location)
    if fields.show_email and node.email:
        lines.append(node.email)

    for line in lines:
        c.drawString(text_x, cursor_y, _truncate(line, BODY_FONT, BODY_SIZE, max_text_w))
        cursor_y -= 12


def _truncate(text: str, font: str, size: float, max_width: float) -> str:
    if stringWidth(text, font, size) <= max_width:
        return text
    ellipsis = "…"
    lo, hi = 0, len(text)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        candidate = text[:mid] + ellipsis
        if stringWidth(candidate, font, size) <= max_width:
            lo = mid
        else:
            hi = mid - 1
    return text[:lo] + ellipsis if lo > 0 else ellipsis
