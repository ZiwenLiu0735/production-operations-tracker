import type { DbEmployee } from "../lib/employees";

interface DbEmployeeIdentityProps {
  employee: DbEmployee;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: {
    id: "text-xl font-bold",
    name: "text-sm font-medium",
    nick: "text-xs text-white/50",
  },
  md: {
    id: "text-2xl font-bold",
    name: "text-base font-semibold",
    nick: "text-sm text-white/50",
  },
};

export function DbEmployeeIdentity({ employee, size = "sm" }: DbEmployeeIdentityProps) {
  const classes = sizeClasses[size];
  const preferred = employee.preferred_name?.trim();
  const displayName = preferred ?? employee.legal_name.split(" ")[0] ?? employee.legal_name;
  const numberLabel =
    employee.employee_number != null ? `#${employee.employee_number}` : employee.employee_code ?? "—";

  return (
    <div className="text-left">
      <p className={`tabular-nums text-brand-400 ${classes.id}`}>{numberLabel}</p>
      <p className={`text-white ${classes.name}`}>{displayName}</p>
      {preferred && preferred !== displayName && (
        <p className={classes.nick}>{employee.legal_name}</p>
      )}
    </div>
  );
}
