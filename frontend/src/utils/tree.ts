import type { OrgNode } from "@/types/employee";

export function flattenTree(trees: OrgNode[]): OrgNode[] {
  const out: OrgNode[] = [];
  const walk = (node: OrgNode) => {
    out.push(node);
    node.children.forEach(walk);
  };
  trees.forEach(walk);
  return out;
}

export function buildNodeIndex(trees: OrgNode[]): Map<string, OrgNode> {
  const map = new Map<string, OrgNode>();
  flattenTree(trees).forEach((node) => map.set(node.id, node));
  return map;
}

export function buildParentIndex(trees: OrgNode[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  const walk = (node: OrgNode, parentId: string | null) => {
    map.set(node.id, parentId);
    node.children.forEach((child) => walk(child, node.id));
  };
  trees.forEach((root) => walk(root, null));
  return map;
}

/** All descendant ids of a node, not including the node itself. */
export function getDescendantIds(node: OrgNode): string[] {
  const out: string[] = [];
  const walk = (n: OrgNode) => {
    n.children.forEach((child) => {
      out.push(child.id);
      walk(child);
    });
  };
  walk(node);
  return out;
}

/** Extracts the subtree rooted at `nodeId` as a standalone tree (deep structural copy not required — same node objects). */
export function extractSubtree(trees: OrgNode[], nodeId: string): OrgNode | null {
  return buildNodeIndex(trees).get(nodeId) ?? null;
}

/** Builds a pruned copy of the forest containing only nodes whose id is in `keepIds`
 * plus their ancestors (so partial subtrees still form a connected tree). */
export function pruneTree(trees: OrgNode[], keepIds: Set<string>): OrgNode[] {
  const prune = (node: OrgNode): OrgNode | null => {
    const children = node.children.map(prune).filter((c): c is OrgNode => c !== null);
    if (keepIds.has(node.id) || children.length > 0) {
      return { ...node, children };
    }
    return null;
  };
  return trees.map(prune).filter((n): n is OrgNode => n !== null);
}

/** Returns a copy of the forest with every node's children sorted by department,
 * so departments visually cluster together while reporting lines stay intact. */
export function sortTreeByDepartment(trees: OrgNode[]): OrgNode[] {
  const clone = (node: OrgNode): OrgNode => ({
    ...node,
    children: [...node.children].sort((a, b) => a.department.localeCompare(b.department)).map(clone),
  });
  return trees.map(clone);
}

export interface SearchableEmployee {
  employee_id: string;
  name: string;
  designation: string;
  department: string;
}

export function searchEmployees<T extends SearchableEmployee>(employees: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return employees.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
  );
}
