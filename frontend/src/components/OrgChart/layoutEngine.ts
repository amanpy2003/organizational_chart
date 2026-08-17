import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";

import type { OrgNode } from "@/types/employee";
import type { AppearanceConfig, LayoutMode } from "@/types/chartConfig";

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
  appearance: AppearanceConfig;
}

function edgeType(connectorStyle: AppearanceConfig["connectorStyle"]): string {
  return connectorStyle === "curved" ? "default" : connectorStyle === "straight" ? "straight" : "smoothstep";
}

export function buildFlowGraph(args: BuildGraphArgs): { nodes: Node<EmployeeNodeData>[]; edges: Edge[] } {
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
