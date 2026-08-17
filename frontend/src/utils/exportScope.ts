import type { OrgNode } from "@/types/employee";
import { buildNodeIndex, buildParentIndex, extractSubtree, pruneTree } from "@/utils/tree";

export function scopeEntireOrganization(trees: OrgNode[]): OrgNode[] {
  return trees;
}

/** Mirrors the current expand/collapse state: collapsed nodes are exported as leaves. */
export function scopeCurrentView(trees: OrgNode[], collapsedIds: Set<string>): OrgNode[] {
  const clip = (node: OrgNode): OrgNode => {
    if (collapsedIds.has(node.id)) {
      return { ...node, children: [] };
    }
    return { ...node, children: node.children.map(clip) };
  };
  return trees.map(clip);
}

export function scopeDepartment(trees: OrgNode[], department: string): OrgNode[] {
  const keepIds = new Set<string>();
  const walk = (node: OrgNode) => {
    if (node.department === department) keepIds.add(node.id);
    node.children.forEach(walk);
  };
  trees.forEach(walk);
  return pruneTree(trees, keepIds);
}

/** The employee plus everyone reporting up through them, at any depth — their whole team, no ancestors. */
export function scopeEmployeeSubtree(trees: OrgNode[], employeeId: string): OrgNode[] {
  const target = extractSubtree(trees, employeeId);
  return target ? [target] : [];
}

/** Reporting chain (ancestors) down to the employee, plus the employee's direct reports. */
export function scopeEmployeeChain(trees: OrgNode[], employeeId: string): OrgNode[] {
  const nodeIndex = buildNodeIndex(trees);
  const parentIndex = buildParentIndex(trees);
  const target = nodeIndex.get(employeeId);
  if (!target) return [];

  const chainIds: string[] = [employeeId];
  let current = parentIndex.get(employeeId) ?? null;
  while (current) {
    chainIds.unshift(current);
    current = parentIndex.get(current) ?? null;
  }

  const rootId = chainIds[0];
  const trimmed: OrgNode = { ...target, children: target.children.map((c) => ({ ...c, children: [] })) };

  const rebuild = (id: string): OrgNode => {
    if (id === employeeId) return trimmed;
    const node = nodeIndex.get(id)!;
    const nextId = chainIds[chainIds.indexOf(id) + 1];
    return { ...node, children: [rebuild(nextId)] };
  };

  return [rebuild(rootId)];
}
