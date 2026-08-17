export type LayoutMode = "vertical" | "horizontal" | "compact" | "department";

/** What determines each card's row/column position:
 * - "reporting": how deep they are in the actual reporting chain (default,
 *   existing behavior).
 * - "designation": their designation-hierarchy level (1 Vice Chairman ... 8
 *   Supervisor/Trainee/Retainer), independent of reporting depth. Real
 *   reporting-line connectors are still drawn between actual manager/report
 *   pairs — they just may span across levels visually when a manager and
 *   report aren't adjacent designation levels. */
export type RankBy = "reporting" | "designation";

export type ConnectorStyle = "orthogonal" | "curved" | "straight";

export interface CardFieldVisibility {
  showEmployeeId: boolean;
  showDesignation: boolean;
  showDepartment: boolean;
  showLocation: boolean;
  showEmail: boolean;
}

export interface AppearanceConfig {
  cardSize: "compact" | "comfortable" | "spacious";
  fontSize: "small" | "medium" | "large";
  connectorStyle: ConnectorStyle;
  levelSpacing: number; // px between hierarchy levels
  siblingSpacing: number; // px between sibling cards
  departmentColorCoding: boolean;
}

export interface ChartConfig {
  layout: LayoutMode;
  rankBy: RankBy;
  fields: CardFieldVisibility;
  appearance: AppearanceConfig;
}

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  layout: "vertical",
  rankBy: "reporting",
  fields: {
    showEmployeeId: false,
    showDesignation: true,
    showDepartment: true,
    showLocation: false,
    showEmail: false,
  },
  appearance: {
    cardSize: "comfortable",
    fontSize: "medium",
    connectorStyle: "orthogonal",
    levelSpacing: 90,
    siblingSpacing: 40,
    departmentColorCoding: true,
  },
};

export type PdfPageSize = "A4" | "A3" | "A2" | "A1" | "A0" | "AUTO";
export type PdfOrientation = "portrait" | "landscape";
export type ExportScope = "entire" | "current-view" | "department" | "employee-chain" | "employee-subtree";

export interface PdfExportOptions {
  scope: ExportScope;
  pageSize: PdfPageSize;
  orientation: PdfOrientation;
}
