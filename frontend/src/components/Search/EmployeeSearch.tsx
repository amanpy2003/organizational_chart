import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { useOrgStore } from "@/store/orgStore";
import { searchEmployees } from "@/utils/tree";

export function EmployeeSearch() {
  const employees = useOrgStore((s) => s.employees);
  const selectEmployee = useOrgStore((s) => s.selectEmployee);
  const expandAncestorsOf = useOrgStore((s) => s.expandAncestorsOf);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchEmployees(employees, query).slice(0, 8), [employees, query]);

  const pick = (employeeId: string) => {
    expandAncestorsOf(employeeId);
    selectEmployee(employeeId);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-64" ref={containerRef}>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search employee, ID, title…"
          className="h-9 w-full rounded-lg border border-ink-200 bg-white pl-8 pr-7 text-sm text-ink-800 placeholder:text-ink-400 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && query && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-ink-100 bg-white shadow-panel">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-ink-400">No employees match "{query}".</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((e) => (
                <li key={e.employee_id}>
                  <button
                    onClick={() => pick(e.employee_id)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-ink-50"
                  >
                    <span className="text-sm font-medium text-ink-800">{e.name}</span>
                    <span className="text-xs text-ink-500">
                      {e.designation} {e.department && `· ${e.department}`} · {e.employee_id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
