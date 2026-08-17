import { MapPin } from "lucide-react";

import { useOrgStore, useLocationNames } from "@/store/orgStore";
import { MultiSelectFilter } from "./MultiSelectFilter";

export function LocationFilter() {
  const locations = useLocationNames();
  const selected = useOrgStore((s) => s.selectedLocations);
  const toggleLocation = useOrgStore((s) => s.toggleLocation);
  const selectAll = useOrgStore((s) => s.selectAllLocations);
  const deselectAll = useOrgStore((s) => s.deselectAllLocations);

  return (
    <MultiSelectFilter
      icon={<MapPin size={14} />}
      label="Location"
      options={locations}
      selected={selected}
      onToggle={toggleLocation}
      onSelectAll={selectAll}
      onDeselectAll={deselectAll}
    />
  );
}
