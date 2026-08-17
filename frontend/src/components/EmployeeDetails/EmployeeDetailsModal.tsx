import { useMemo, type ReactNode } from "react";
import { ChevronRight, Mail, MapPin, Building2, IdCard, BadgeCheck, Users } from "lucide-react";

import { Modal } from "@/components/common/Modal";
import { useOrgStore } from "@/store/orgStore";
import { tint } from "@/utils/colors";

export function EmployeeDetailsModal() {
  const employees = useOrgStore((s) => s.employees);
  const detailsEmployeeId = useOrgStore((s) => s.detailsEmployeeId);
  const openEmployeeDetails = useOrgStore((s) => s.openEmployeeDetails);
  const closeEmployeeDetails = useOrgStore((s) => s.closeEmployeeDetails);
  const expandAncestorsOf = useOrgStore((s) => s.expandAncestorsOf);

  const employee = useMemo(
    () => employees.find((e) => e.employee_id === detailsEmployeeId) ?? null,
    [employees, detailsEmployeeId]
  );

  const byId = useMemo(() => new Map(employees.map((e) => [e.employee_id, e])), [employees]);

  if (!employee) return null;

  const goTo = (id: string) => {
    expandAncestorsOf(id);
    openEmployeeDetails(id);
  };

  return (
    <Modal
      open={!!detailsEmployeeId}
      onOpenChange={(open) => !open && closeEmployeeDetails()}
      title={employee.name}
      description={[employee.designation, employee.department].filter(Boolean).join(" · ")}
      size="lg"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Details</h3>
          <dl className="space-y-2.5">
            <DetailRow icon={<IdCard size={14} />} label="Employee ID" value={employee.employee_id} />
            <DetailRow icon={<Building2 size={14} />} label="Department" value={employee.department || "—"} />
            {employee.location && <DetailRow icon={<MapPin size={14} />} label="Location" value={employee.location} />}
            {employee.email && <DetailRow icon={<Mail size={14} />} label="Email" value={employee.email} />}
            {employee.employment_type && (
              <DetailRow icon={<BadgeCheck size={14} />} label="Employment Type" value={employee.employment_type} />
            )}
            {employee.status && (
              <DetailRow
                icon={<span className="h-2 w-2 rounded-full bg-emerald-500" />}
                label="Status"
                value={employee.status}
              />
            )}
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Reporting Chain</h3>
          {employee.reporting_chain.length === 0 ? (
            <p className="text-sm text-ink-400">Top-level employee — no manager.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-1 text-sm">
              {employee.reporting_chain.map((id, idx) => {
                const person = byId.get(id);
                return (
                  <span key={id} className="flex items-center gap-1">
                    <button onClick={() => goTo(id)} className="rounded px-1.5 py-0.5 text-brand-700 hover:bg-brand-50">
                      {person?.name ?? id}
                    </button>
                    {idx < employee.reporting_chain.length - 1 && <ChevronRight size={13} className="text-ink-300" />}
                  </span>
                );
              })}
              <ChevronRight size={13} className="text-ink-300" />
              <span className="rounded px-1.5 py-0.5 font-medium text-ink-900">{employee.name}</span>
            </div>
          )}

          <h3 className="mb-2 mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <Users size={12} /> Direct Reports ({employee.direct_report_ids.length})
          </h3>
          {employee.direct_report_ids.length === 0 ? (
            <p className="text-sm text-ink-400">No direct reports.</p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {employee.direct_report_ids.map((id) => {
                const person = byId.get(id);
                if (!person) return null;
                return (
                  <li key={id}>
                    <button
                      onClick={() => goTo(id)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-ink-50"
                    >
                      <span className="text-ink-800">{person.name}</span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: tint(person.department_color, 0.12), color: person.department_color || "#475569" }}
                      >
                        {person.designation}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 text-ink-400">{icon}</span>
      <div>
        <dt className="text-xs text-ink-400">{label}</dt>
        <dd className="text-ink-800">{value}</dd>
      </div>
    </div>
  );
}
