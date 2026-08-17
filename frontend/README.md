# Frontend — Organizational Chart Generator

React + TypeScript + Vite. Renders the interactive org chart with
`@xyflow/react` (React Flow) + `dagre` for automatic hierarchical layout.

## Structure

```
src/
  components/
    OrgChart/        canvas, dagre layout engine, custom node, toolbar
    EmployeeCard/     shared card renderer used by the chart node
    Upload/           dropzone + template download
    Filters/          department / level filters
    Search/            employee search with jump-to + reporting-chain expand
    Settings/          chart configuration panel (fields, layout, appearance)
    EmployeeDetails/    details modal (full record, reporting chain, direct reports)
    Export/             PDF dialog + PNG/SVG/Excel export menu
    ValidationReport/   validation summary + error list
    common/             Button, Modal, Tooltip, Select, Checkbox, Toast, states
  pages/                DashboardPage, ChartPage
  services/             api.ts (backend calls)
  store/                orgStore (zustand, persisted), toastStore
  utils/                tree.ts, colors.ts, exportScope.ts
  types/                employee.ts, validation.ts, upload.ts, chartConfig.ts
```

## Running

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL if the backend isn't on :8000
npm run dev
```

## Testing

```bash
npm run test     # vitest — pure utility functions (tree flatten/search/prune)
npm run lint      # tsc --noEmit
```

UI/interaction testing (chart rendering with large/wide/deep trees, PDF
export, filters) is done by running the app end-to-end against the backend's
sample fixtures — see the root README's Quick Start.
