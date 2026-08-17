import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { EmployeeCard } from "@/components/EmployeeCard/EmployeeCard";
import { useOrgStore } from "@/store/orgStore";
import type { EmployeeNodeData } from "./layoutEngine";

function EmployeeNodeComponent({ data }: NodeProps) {
  const { node, hasHiddenChildren, hiddenCount, isCollapsed, isDimmed, isHighlighted, layoutMode } =
    data as unknown as EmployeeNodeData;

  const chartConfig = useOrgStore((s) => s.chartConfig);
  const toggleCollapse = useOrgStore((s) => s.toggleCollapse);
  const openEmployeeDetails = useOrgStore((s) => s.openEmployeeDetails);

  // Compact mode stacks children in a column to the right of their parent
  // (see layoutEngine's buildCompactListGraph), so its connectors flow
  // left-to-right just like horizontal mode's do.
  const flowsRightward = layoutMode === "horizontal" || layoutMode === "compact";
  const targetPos = flowsRightward ? Position.Left : Position.Top;
  const sourcePos = flowsRightward ? Position.Right : Position.Bottom;

  return (
    <div style={{ width: 208 }}>
      <Handle type="target" position={targetPos} style={{ opacity: 0 }} />
      <EmployeeCard
        node={node}
        fields={chartConfig.fields}
        cardSize={chartConfig.appearance.cardSize}
        fontSize={chartConfig.appearance.fontSize}
        departmentColorCoding={chartConfig.appearance.departmentColorCoding}
        isDimmed={isDimmed}
        isHighlighted={isHighlighted}
        hasHiddenChildren={hasHiddenChildren}
        hiddenCount={hiddenCount}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => toggleCollapse(node.id)}
        onClick={() => openEmployeeDetails(node.id)}
      />
      <Handle type="source" position={sourcePos} style={{ opacity: 0 }} />
    </div>
  );
}

export const EmployeeNode = memo(EmployeeNodeComponent);
