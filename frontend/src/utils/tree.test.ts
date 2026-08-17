import { describe, expect, it } from "vitest";

import {
  buildNodeIndex,
  buildParentIndex,
  flattenTree,
  getDescendantIds,
  pruneTree,
  searchEmployees,
} from "./tree";
import type { OrgNode } from "@/types/employee";

function makeNode(id: string, children: OrgNode[] = [], department = "Corporate"): OrgNode {
  return {
    id,
    name: `Name ${id}`,
    designation: "Designation",
    department,
    location: "",
    email: "",
    employee_id: id,
    employment_type: "",
    status: "",
    level: "",
    department_color: "#2563EB",
    designation_level: 0,
    depth: 0,
    subtree_size: children.length,
    children,
  };
}

const tree = makeNode("A", [
  makeNode("B", [makeNode("D"), makeNode("E")]),
  makeNode("C", [], "Finance"),
]);

describe("flattenTree", () => {
  it("returns every node in the forest", () => {
    const flat = flattenTree([tree]);
    expect(flat.map((n) => n.id).sort()).toEqual(["A", "B", "C", "D", "E"]);
  });
});

describe("buildNodeIndex / buildParentIndex", () => {
  it("indexes nodes by id and tracks parents", () => {
    const nodeIndex = buildNodeIndex([tree]);
    const parentIndex = buildParentIndex([tree]);
    expect(nodeIndex.get("D")?.id).toBe("D");
    expect(parentIndex.get("D")).toBe("B");
    expect(parentIndex.get("A")).toBeNull();
  });
});

describe("getDescendantIds", () => {
  it("excludes the node itself", () => {
    const ids = getDescendantIds(tree).sort();
    expect(ids).toEqual(["B", "C", "D", "E"]);
  });
});

describe("pruneTree", () => {
  it("keeps ancestors of kept nodes even if the ancestor itself is not in keepIds", () => {
    const pruned = pruneTree([tree], new Set(["D"]));
    const flat = flattenTree(pruned);
    expect(flat.map((n) => n.id).sort()).toEqual(["A", "B", "D"]);
  });
});

describe("searchEmployees", () => {
  const employees = [
    { employee_id: "E001", name: "Amit Sharma", designation: "MD", department: "Corporate" },
    { employee_id: "E002", name: "Rahul Verma", designation: "VP Projects", department: "Projects" },
  ];

  it("matches by name, id, designation, or department", () => {
    expect(searchEmployees(employees, "amit")).toHaveLength(1);
    expect(searchEmployees(employees, "E002")).toHaveLength(1);
    expect(searchEmployees(employees, "projects")).toHaveLength(1);
  });

  it("returns nothing for an empty query", () => {
    expect(searchEmployees(employees, "  ")).toHaveLength(0);
  });
});
