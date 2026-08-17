import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";

import type { OrgNode } from "@/types/employee";
import type { AppearanceConfig, LayoutMode, RankBy } from "@/types/chartConfig";

export interface EmployeeNodeData extends Record<string, unknown> {
  node: OrgNode;
  hasHiddenChildren: boolean;
  hiddenCount: number;
  isCollapsed: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  layoutMode: LayoutMode;
}

export const CARD_SIZES: Record<AppearanceConfig["cardSize"], { width: number; baseHeight: number }> = {
  compact: { width: 168, baseHeight: 52 },
  comfortable: { width: 208, baseHeight: 64 },
  spacious: { width: 244, baseHeight: 76 },
};

interface BuildGraphArgs {
  trees: OrgNode[];
  collapsedIds: Set<string>;
  visibleIds: Set<string> | null; // null = all visible (no department filter)
  highlightedIds: Set<string>;
  layout: LayoutMode;
  rankBy: RankBy;
  appearance: AppearanceConfig;
}

function edgeType(connectorStyle: AppearanceConfig["connectorStyle"]): string {
  return connectorStyle === "curved" ? "default" : connectorStyle === "straight" ? "straight" : "smoothstep";
}

// Mirrors backend/app/services/designation_level_service.py's MAX_LEVEL —
// the number of real designation levels (1 Vice Chairman ... 24 Retainer).
// Bump both together if the level scheme grows.
const MAX_DESIGNATION_LEVEL = 24;

/** A designation level mapped to a 0-based rank/column; unclassified (0)
 * sinks to the bottom-most column rather than being mistaken for "most
 * senior". */
function designationRank(node: OrgNode): number {
  return node.designation_level > 0 ? node.designation_level - 1 : MAX_DESIGNATION_LEVEL;
}

export function buildFlowGraph(args: BuildGraphArgs): { nodes: Node<EmployeeNodeData>[]; edges: Edge[] } {
  // Designation-level ranking is a fixed, canonical arrangement (senior-to-
  // junior columns left to right) regardless of the Layout selector — the
  // toolbar disables that selector while this is active — so it's checked
  // ahead of the layout-specific branches below.
  if (args.rankBy === "designation") {
    return buildRankedGraph(args);
  }
  if (args.layout === "compact") {
    return buildCompactListGraph(args);
  }
  return buildDagreGraph(args);
}

/**
 * "Compact" layout: an indented outline/tree-list rather than a classic
 * top-down hierarchy. Each node's children stack in a single column
 * immediately to its right instead of spreading out side by side, so a
 * manager with 20+ direct reports grows a tall narrow column instead of one
 * very wide row. Dagre can't produce this (it always lays out a whole rank
 * side by side), so this is a standalone recursive placement pass.
 */
function buildCompactListGraph({
  trees,
  collapsedIds,
  visibleIds,
  highlightedIds,
  layout,
  appearance,
}: BuildGraphArgs): { nodes: Node<EmployeeNodeData>[]; edges: Edge[] } {
  const { width: cardWidth, baseHeight } = CARD_SIZES[appearance.cardSize];
  const cardHeight = baseHeight + 2 * 4;
  const COL_GAP = Math.max(40, appearance.levelSpacing * 0.55);
  const ROW_GAP = Math.max(10, appearance.siblingSpacing * 0.3);
  const TREE_GAP = ROW_GAP * 4;

  const nodes: Node<EmployeeNodeData>[] = [];
  const edges: Edge[] = [];
  const anyDimming = !!visibleIds || highlightedIds.size > 0;
  const type = edgeType(appearance.connectorStyle);

  // Places `node`'s subtree with its own card's top-left at (x, y) and
  // returns the Y just past the bottom of everything it placed, so the
  // caller can stack the next sibling below without overlap.
  const place = (node: OrgNode, parentId: string | null, x: number, y: number): number => {
    if (visibleIds && !visibleIds.has(node.id)) {
      let cursorY = y;
      node.children.forEach((child, idx) => {
        if (idx > 0) cursorY += ROW_GAP;
        cursorY = place(child, parentId, x, cursorY);
      });
      return Math.max(cursorY, y);
    }

    const isCollapsed = collapsedIds.has(node.id);
    const hasHiddenChildren = isCollapsed && node.children.length > 0;

    nodes.push({
      id: node.id,
      type: "employee",
      position: { x, y },
      data: {
        node,
        hasHiddenChildren,
        hiddenCount: hasHiddenChildren ? countDescendants(node) : 0,
        isCollapsed,
        isDimmed: anyDimming && !highlightedIds.has(node.id) && highlightedIds.size > 0,
        isHighlighted: highlightedIds.has(node.id),
        layoutMode: layout,
      },
      draggable: false,
    });

    if (parentId) {
      edges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        type,
        style: { stroke: "#94A3B8", strokeWidth: 1.5 },
      });
    }

    if (isCollapsed || node.children.length === 0) {
      return y + cardHeight;
    }

    const childX = x + cardWidth + COL_GAP;
    let cursorY = y;
    node.children.forEach((child, idx) => {
      if (idx > 0) cursorY += ROW_GAP;
      cursorY = place(child, node.id, childX, cursorY);
    });

    return Math.max(cursorY, y + cardHeight);
  };

  let rootY = 0;
  trees.forEach((root) => {
    rootY = place(root, null, 0, rootY) + TREE_GAP;
  });

  return { nodes, edges };
}

interface VisibleEntry {
  node: OrgNode;
  parentId: string | null;
  childIds: string[];
  hasHiddenChildren: boolean;
  hiddenCount: number;
}

/** Walks the tree once, resolving department-filter skip-through (an
 * invisible node's children reconnect to its nearest visible ancestor) and
 * collapse state, into a flat id -> entry map that both graph builders below
 * can do pure position math over without re-deriving visibility rules. */
function buildVisibleEntries(
  trees: OrgNode[],
  collapsedIds: Set<string>,
  visibleIds: Set<string> | null
): Map<string, VisibleEntry> {
  const entries = new Map<string, VisibleEntry>();

  const walk = (node: OrgNode, parentId: string | null) => {
    if (visibleIds && !visibleIds.has(node.id)) {
      node.children.forEach((c) => walk(c, parentId));
      return;
    }

    const isCollapsed = collapsedIds.has(node.id);
    entries.set(node.id, {
      node,
      parentId,
      childIds: [],
      hasHiddenChildren: isCollapsed && node.children.length > 0,
      hiddenCount: isCollapsed && node.children.length > 0 ? countDescendants(node) : 0,
    });
    if (parentId) {
      entries.get(parentId)!.childIds.push(node.id);
    }
    if (!isCollapsed) {
      node.children.forEach((c) => walk(c, node.id));
    }
  };

  trees.forEach((root) => walk(root, null));
  return entries;
}

/**
 * Used whenever rankBy is "designation" — always the same canonical
 * arrangement regardless of the (disabled, in this mode) Layout selector:
 * designation-level columns run left (most senior) to right (least senior),
 * each employee sits in the column matching their own designation level,
 * and the real Employee-ID/Reports-To connectors are drawn exactly as they
 * exist in the data, spanning across columns when a manager and their
 * report aren't adjacent levels.
 *
 * Dagre always derives rank purely from edge topology (how many hops from a
 * root), with no supported way to pin a node to an explicit rank — which is
 * exactly what's needed here, since a report's designation level has
 * nothing to do with how many reporting hops separate them from their
 * manager. So this bypasses dagre entirely with the same bottom-up
 * subtree-size / top-down centering approach used server-side for PDF
 * layout (see backend/app/utils/tree_layout.py) to position siblings along
 * the column (main) axis, while the column itself comes from
 * designationRank(node) instead of tree depth.
 */
function buildRankedGraph({
  trees,
  collapsedIds,
  visibleIds,
  highlightedIds,
  appearance,
}: BuildGraphArgs): { nodes: Node<EmployeeNodeData>[]; edges: Edge[] } {
  const { width: cardWidth, baseHeight } = CARD_SIZES[appearance.cardSize];
  const cardHeight = baseHeight + 2 * 4;
  const mainSize = cardHeight; // siblings stack vertically within a column
  const siblingGap = appearance.siblingSpacing;
  const treeGap = siblingGap * 3;
  const columnStep = cardWidth + appearance.levelSpacing;

  const entries = buildVisibleEntries(trees, collapsedIds, visibleIds);
  const rootIds = [...entries.keys()].filter((id) => entries.get(id)!.parentId === null);

  const widths = new Map<string, number>();
  const centers = new Map<string, number>();

  const computeWidth = (id: string): number => {
    const { childIds } = entries.get(id)!;
    let w: number;
    if (childIds.length === 0) {
      w = mainSize;
    } else {
      const childTotal = childIds.reduce((sum, cid) => sum + computeWidth(cid), 0) + siblingGap * (childIds.length - 1);
      w = Math.max(mainSize, childTotal);
    }
    widths.set(id, w);
    return w;
  };

  const assign = (id: string, left: number): void => {
    const { childIds } = entries.get(id)!;
    const w = widths.get(id)!;
    if (childIds.length === 0) {
      centers.set(id, left + w / 2);
      return;
    }
    const childrenSpan = childIds.reduce((sum, cid) => sum + widths.get(cid)!, 0) + siblingGap * (childIds.length - 1);
    let cursor = left + (w - childrenSpan) / 2;
    childIds.forEach((cid) => {
      assign(cid, cursor);
      cursor += widths.get(cid)! + siblingGap;
    });
    const firstCenter = centers.get(childIds[0])!;
    const lastCenter = centers.get(childIds[childIds.length - 1])!;
    centers.set(id, (firstCenter + lastCenter) / 2);
  };

  let offset = 0;
  rootIds.forEach((rootId) => {
    computeWidth(rootId);
    assign(rootId, offset);
    offset += widths.get(rootId)! + treeGap;
  });

  const nodes: Node<EmployeeNodeData>[] = [];
  const edges: Edge[] = [];
  const anyDimming = !!visibleIds || highlightedIds.size > 0;
  const type = edgeType(appearance.connectorStyle);

  entries.forEach((entry, id) => {
    const center = centers.get(id)!;
    const column = designationRank(entry.node) * columnStep;

    nodes.push({
      id,
      type: "employee",
      position: { x: column, y: center - cardHeight / 2 },
      data: {
        node: entry.node,
        hasHiddenChildren: entry.hasHiddenChildren,
        hiddenCount: entry.hiddenCount,
        isCollapsed: collapsedIds.has(id),
        isDimmed: anyDimming && !highlightedIds.has(id) && highlightedIds.size > 0,
        isHighlighted: highlightedIds.has(id),
        // Handles need to be Left/Right (not Top/Bottom) since columns run
        // left-to-right here regardless of what the Layout selector says.
        layoutMode: "horizontal",
      },
      draggable: false,
    });

    if (entry.parentId) {
      edges.push({
        id: `${entry.parentId}->${id}`,
        source: entry.parentId,
        target: id,
        type,
        style: { stroke: "#94A3B8", strokeWidth: 1.5 },
      });
    }
  });

  return { nodes, edges };
}

function buildDagreGraph({
  trees,
  collapsedIds,
  visibleIds,
  highlightedIds,
  layout,
  appearance,
}: BuildGraphArgs): { nodes: Node<EmployeeNodeData>[]; edges: Edge[] } {
  const direction = layout === "horizontal" ? "LR" : "TB";
  const { width: cardWidth, baseHeight } = CARD_SIZES[appearance.cardSize];
  const fieldLines = 2; // rough estimate for dagre spacing; real height is set by the card component itself
  const cardHeight = baseHeight + fieldLines * 4;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: appearance.siblingSpacing,
    ranksep: appearance.levelSpacing,
    marginx: 24,
    marginy: 24,
  });

  const nodes: Node<EmployeeNodeData>[] = [];
  const edges: Edge[] = [];
  const anyDimming = !!visibleIds || highlightedIds.size > 0;

  const walk = (node: OrgNode, parentId: string | null) => {
    if (visibleIds && !visibleIds.has(node.id)) {
      // Node itself filtered out, but its children might still match (they'll
      // reconnect visually to the nearest visible ancestor via edge remap below).
      node.children.forEach((c) => walk(c, parentId));
      return;
    }

    const isCollapsed = collapsedIds.has(node.id);
    const hasHiddenChildren = isCollapsed && node.children.length > 0;

    g.setNode(node.id, { width: cardWidth, height: cardHeight });
    nodes.push({
      id: node.id,
      type: "employee",
      position: { x: 0, y: 0 },
      data: {
        node,
        hasHiddenChildren,
        hiddenCount: hasHiddenChildren ? countDescendants(node) : 0,
        isCollapsed,
        isDimmed: anyDimming && !highlightedIds.has(node.id) && highlightedIds.size > 0,
        isHighlighted: highlightedIds.has(node.id),
        layoutMode: layout,
      },
      draggable: false,
    });

    if (parentId) {
      g.setEdge(parentId, node.id);
      edges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        type: edgeType(appearance.connectorStyle),
        style: { stroke: "#94A3B8", strokeWidth: 1.5 },
      });
    }

    if (!isCollapsed) {
      node.children.forEach((c) => walk(c, node.id));
    }
  };

  trees.forEach((root) => walk(root, null));

  dagre.layout(g);

  nodes.forEach((node) => {
    const pos = g.node(node.id);
    if (pos) {
      node.position = { x: pos.x - cardWidth / 2, y: pos.y - cardHeight / 2 };
    }
  });

  return { nodes, edges };
}

function countDescendants(node: OrgNode): number {
  let count = 0;
  const walk = (n: OrgNode) => {
    n.children.forEach((c) => {
      count += 1;
      walk(c);
    });
  };
  walk(node);
  return count;
}
