import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Employee, OrgNode } from "@/types/employee";
import type { OrgSummary, ValidationResult } from "@/types/validation";
import type { UploadResponse } from "@/types/upload";
import { DEFAULT_CHART_CONFIG, type ChartConfig } from "@/types/chartConfig";
import { flattenTree } from "@/utils/tree";

const AUTO_COLLAPSE_EMPLOYEE_THRESHOLD = 80;
const AUTO_COLLAPSE_DEPTH = 2;

interface OrgState {
  employees: Employee[];
  trees: OrgNode[];
  summary: OrgSummary | null;
  validation: ValidationResult | null;
  chartGenerated: boolean;
  fileName: string | null;

  chartConfig: ChartConfig;
  selectedDepartments: string[] | null; // null = all departments visible, [] = none visible
  selectedLocations: string[] | null; // null = all locations visible, [] = none visible
  maxDepth: number | null; // null = all levels visible
  collapsedIds: string[];
  // Highlighted/centered on the canvas (set by search or a card click).
  selectedEmployeeId: string | null;
  // Drives the EmployeeDetailsModal — separate from `selectedEmployeeId` so
  // that searching for someone highlights + centers them without forcing
  // their details modal open; only an explicit card click (or navigating
  // within the modal) opens it.
  detailsEmployeeId: string | null;
  searchQuery: string;

  setUploadResult: (resp: UploadResponse, fileName: string) => void;
  reset: () => void;
  updateChartConfig: (patch: Partial<ChartConfig>) => void;
  toggleDepartment: (dept: string) => void;
  selectAllDepartments: () => void;
  deselectAllDepartments: () => void;
  toggleLocation: (location: string) => void;
  selectAllLocations: () => void;
  deselectAllLocations: () => void;
  setMaxDepth: (depth: number | null) => void;
  toggleCollapse: (nodeId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  selectEmployee: (id: string | null) => void;
  openEmployeeDetails: (id: string) => void;
  closeEmployeeDetails: () => void;
  setSearchQuery: (q: string) => void;
  expandAncestorsOf: (nodeId: string) => void;
}

/** Locations are descriptive-only (unlike department, they're not on
 * OrgSummary from the backend), so unique values are derived client-side
 * from the flat employee list. Blank locations are grouped as "Unassigned",
 * mirroring how the backend already treats a blank department. */
export function locationNamesOf(employees: Employee[]): string[] {
  const set = new Set<string>();
  employees.forEach((e) => set.add(e.location?.trim() || "Unassigned"));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Shared toggle semantics for both the department and location multi-select
 * filters: toggling an item that would leave every option selected collapses
 * back to `null` (meaning "unfiltered"), so the filter badge only shows up
 * once the user has genuinely narrowed something down. */
function toggleInSelection(current: string[] | null, all: string[], item: string): string[] | null {
  const base = current ?? all;
  const next = base.includes(item) ? base.filter((v) => v !== item) : [...base, item];
  return next.length === all.length ? null : next;
}

function computeDefaultCollapsed(trees: OrgNode[], employeeCount: number): string[] {
  if (employeeCount < AUTO_COLLAPSE_EMPLOYEE_THRESHOLD) return [];
  const collapsed: string[] = [];
  const walk = (node: OrgNode) => {
    if (node.depth === AUTO_COLLAPSE_DEPTH && node.children.length > 0) {
      collapsed.push(node.id);
      return;
    }
    node.children.forEach(walk);
  };
  trees.forEach(walk);
  return collapsed;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      employees: [],
      trees: [],
      summary: null,
      validation: null,
      chartGenerated: false,
      fileName: null,

      chartConfig: DEFAULT_CHART_CONFIG,
      selectedDepartments: null,
      selectedLocations: null,
      maxDepth: null,
      collapsedIds: [],
      selectedEmployeeId: null,
      detailsEmployeeId: null,
      searchQuery: "",

      setUploadResult: (resp, fileName) =>
        set({
          employees: resp.employees,
          trees: resp.trees,
          summary: resp.summary,
          validation: resp.validation,
          chartGenerated: resp.chart_generated,
          fileName,
          selectedDepartments: null,
          selectedLocations: null,
          maxDepth: null,
          collapsedIds: computeDefaultCollapsed(resp.trees, resp.summary.employee_count),
          selectedEmployeeId: null,
          detailsEmployeeId: null,
          searchQuery: "",
        }),

      reset: () =>
        set({
          employees: [],
          trees: [],
          summary: null,
          validation: null,
          chartGenerated: false,
          fileName: null,
          selectedDepartments: null,
          selectedLocations: null,
          maxDepth: null,
          collapsedIds: [],
          selectedEmployeeId: null,
          detailsEmployeeId: null,
          searchQuery: "",
        }),

      updateChartConfig: (patch) =>
        set((state) => ({
          chartConfig: {
            ...state.chartConfig,
            ...patch,
            fields: { ...state.chartConfig.fields, ...(patch.fields ?? {}) },
            appearance: { ...state.chartConfig.appearance, ...(patch.appearance ?? {}) },
          },
        })),

      toggleDepartment: (dept) =>
        set((state) => ({
          selectedDepartments: toggleInSelection(
            state.selectedDepartments,
            state.summary?.department_names ?? [],
            dept
          ),
        })),

      selectAllDepartments: () => set({ selectedDepartments: null }),
      deselectAllDepartments: () => set({ selectedDepartments: [] }),

      toggleLocation: (location) =>
        set((state) => ({
          selectedLocations: toggleInSelection(
            state.selectedLocations,
            locationNamesOf(state.employees),
            location
          ),
        })),

      selectAllLocations: () => set({ selectedLocations: null }),
      deselectAllLocations: () => set({ selectedLocations: [] }),

      setMaxDepth: (depth) => set({ maxDepth: depth }),

      toggleCollapse: (nodeId) =>
        set((state) => ({
          collapsedIds: state.collapsedIds.includes(nodeId)
            ? state.collapsedIds.filter((id) => id !== nodeId)
            : [...state.collapsedIds, nodeId],
        })),

      collapseAll: () =>
        set((state) => {
          const ids: string[] = [];
          const walk = (node: OrgNode) => {
            if (node.children.length > 0) {
              ids.push(node.id);
              node.children.forEach(walk);
            }
          };
          state.trees.forEach(walk);
          return { collapsedIds: ids };
        }),

      expandAll: () => set({ collapsedIds: [] }),

      selectEmployee: (id) => set({ selectedEmployeeId: id }),

      openEmployeeDetails: (id) => set({ selectedEmployeeId: id, detailsEmployeeId: id }),

      closeEmployeeDetails: () => set({ detailsEmployeeId: null }),

      setSearchQuery: (q) => set({ searchQuery: q }),

      expandAncestorsOf: (nodeId) =>
        set((state) => {
          const employee = state.employees.find((e) => e.employee_id === nodeId);
          if (!employee) return {};
          const ancestorSet = new Set(employee.reporting_chain);
          return {
            collapsedIds: state.collapsedIds.filter((id) => !ancestorSet.has(id)),
          };
        }),
    }),
    {
      name: "org-chart-session",
      partialize: (state) => ({
        employees: state.employees,
        trees: state.trees,
        summary: state.summary,
        validation: state.validation,
        chartGenerated: state.chartGenerated,
        fileName: state.fileName,
        chartConfig: state.chartConfig,
      }),
    }
  )
);

export function useFilteredNodeIds(): Set<string> | null {
  const trees = useOrgStore((s) => s.trees);
  const selectedDepartments = useOrgStore((s) => s.selectedDepartments);
  const selectedLocations = useOrgStore((s) => s.selectedLocations);
  const maxDepth = useOrgStore((s) => s.maxDepth);
  if (!selectedDepartments && !selectedLocations && maxDepth === null) return null;
  const deptSet = selectedDepartments ? new Set(selectedDepartments) : null;
  const locSet = selectedLocations ? new Set(selectedLocations) : null;
  const ids = new Set<string>();
  flattenTree(trees).forEach((node) => {
    const deptOk = !deptSet || deptSet.has(node.department || "Unassigned");
    const locOk = !locSet || locSet.has(node.location?.trim() || "Unassigned");
    const depthOk = maxDepth === null || node.depth <= maxDepth;
    if (deptOk && locOk && depthOk) ids.add(node.id);
  });
  return ids;
}

export function useLocationNames(): string[] {
  const employees = useOrgStore((s) => s.employees);
  return useMemo(() => locationNamesOf(employees), [employees]);
}
