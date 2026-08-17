import { Building2 } from "lucide-react";

import { useOrgStore } from "@/store/orgStore";
import { MultiSelectFilter } from "./MultiSelectFilter";

export function DepartmentFilter() {
  const departments = useOrgStore((s) => s.summary?.department_names ?? []);
  const selected = useOrgStore((s) => s.selectedDepartments);
  const toggleDepartment = useOrgStore((s) => s.toggleDepartment);
  const selectAll = useOrgStore((s) => s.selectAllDepartments);
  const deselectAll = useOrgStore((s) => s.deselectAllDepartments);

  return (
    <MultiSelectFilter
      icon={<Building2 size={14} />}
      label="Department"
      options={departments}
      selected={selected}
      onToggle={toggleDepartment}
      onSelectAll={selectAll}
      onDeselectAll={deselectAll}
    />
  );
}
