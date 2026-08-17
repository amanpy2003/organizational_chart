export interface Employee {
  row_number: number;
  employee_id: string;
  name: string;
  designation: string;
  department: string;
  reports_to: string | null;
  location: string;
  email: string;
  level: string;
  employment_type: string;
  status: string;
  manager_name: string | null;
  direct_report_ids: string[];
  reporting_chain: string[];
  department_color: string | null;
}

export interface OrgNode {
  id: string;
  name: string;
  designation: string;
  department: string;
  location: string;
  email: string;
  employee_id: string;
  employment_type: string;
  status: string;
  level: string;
  department_color: string | null;
  depth: number;
  subtree_size: number;
  children: OrgNode[];
}
