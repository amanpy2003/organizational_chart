export type LayoutMode = "vertical" | "horizontal" | "compact" | "department";

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
  fields: CardFieldVisibility;
  appearance: AppearanceConfig;
}

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  layout: "vertical",
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
