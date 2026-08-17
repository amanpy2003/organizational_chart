import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useOrgStore, useFilteredNodeIds } from "@/store/orgStore";
import { sortTreeByDepartment } from "@/utils/tree";
import { EmployeeNode } from "./EmployeeNode";
import { buildFlowGraph } from "./layoutEngine";

const nodeTypes: NodeTypes = { employee: EmployeeNode };

export function OrgChartCanvas() {
  const trees = useOrgStore((s) => s.trees);
  const collapsedIds = useOrgStore((s) => s.collapsedIds);
  const chartConfig = useOrgStore((s) => s.chartConfig);
  const selectedEmployeeId = useOrgStore((s) => s.selectedEmployeeId);
  const visibleIds = useFilteredNodeIds();
  const reactFlow = useReactFlow();
  const hasFitOnce = useRef(false);

  const layout = chartConfig.layout === "department" ? "vertical" : chartConfig.layout;

  const trees_sorted = useMemo(() => {
    if (chartConfig.layout !== "department") return trees;
    return sortTreeByDepartment(trees);
  }, [trees, chartConfig.layout]);

  const highlightedIds = useMemo(() => {
    if (!selectedEmployeeId) return new Set<string>();
    return new Set([selectedEmployeeId]);
  }, [selectedEmployeeId]);

  const { nodes, edges } = useMemo(
    () =>
      buildFlowGraph({
        trees: trees_sorted,
        collapsedIds: new Set(collapsedIds),
        visibleIds,
        highlightedIds,
        layout,
        appearance: chartConfig.appearance,
      }),
    [trees_sorted, collapsedIds, visibleIds, highlightedIds, layout, chartConfig.appearance]
  );

  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = setTimeout(() => {
      // Cap how far the *automatic* initial/layout-change fit zooms out — for
      // a wide org, a true full fit can shrink cards to illegibility (and
      // since dagre centers each level over its own subtree, even the top
      // row is often as wide as the whole tree, so "fit just the top level"
      // doesn't actually help). The toolbar's explicit "Fit to screen"
      // button still does a true, unclamped fit for the whole-chart overview.
      reactFlow.fitView({ padding: 0.2, minZoom: 0.5, duration: hasFitOnce.current ? 300 : 0 });
      hasFitOnce.current = true;
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trees_sorted.length, layout]);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    const target = nodes.find((n) => n.id === selectedEmployeeId);
    if (target) {
      reactFlow.setCenter(target.position.x + 104, target.position.y + 40, { zoom: 1, duration: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      minZoom={0.05}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E2E8F0" />
      <Controls showInteractive={false} position="bottom-left" />
      <MiniMap
        pannable
        zoomable
        position="bottom-right"
        nodeColor={(n) => (n.data as any)?.node?.department_color || "#94A3B8"}
        maskColor="rgba(241, 245, 249, 0.7)"
        className="!border !border-ink-200 !shadow-card"
      />
    </ReactFlow>
  );
}
