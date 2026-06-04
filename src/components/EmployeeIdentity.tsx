import type { Employee } from "../types";
import { employeeDisplayName, employeeNickname, formatEmployeeId } from "../utils/employees";

interface EmployeeIdentityProps {
  employee: Employee;
  size?: "sm" | "md" | "lg" | "card";
  align?: "left" | "center";
  /** Summary style: "Deyou Xu (John)" on one line */
  inlineName?: boolean;
}

const sizeClasses = {
  sm: {
    id: "text-xl font-bold",
    name: "text-sm font-medium",
    nick: "text-xs text-white/50",
  },
  card: {
    id: "text-2xl font-bold",
    name: "text-base font-semibold",
    nick: "text-sm text-white/50",
  },
  md: {
    id: "text-2xl font-bold",
    name: "text-base font-semibold",
    nick: "text-sm text-white/50",
  },
  lg: {
    id: "text-4xl font-bold",
    name: "text-2xl font-semibold",
    nick: "text-lg text-white/50",
  },
};

export function EmployeeIdentity({
  employee,
  size = "md",
  align = "left",
  inlineName = false,
}: EmployeeIdentityProps) {
  const classes = sizeClasses[size];
  const alignClass = align === "center" ? "text-center" : "text-left";
  const nick = employeeNickname(employee);

  if (inlineName) {
    return (
      <div className={alignClass}>
        <p className={`tabular-nums text-brand-400 ${classes.id}`}>
          {formatEmployeeId(employee.employeeNumber)}
        </p>
        <p className={`text-white ${classes.name}`}>{employeeDisplayName(employee)}</p>
      </div>
    );
  }

  return (
    <div className={alignClass}>
      <p className={`tabular-nums text-brand-400 ${classes.id}`}>
        {formatEmployeeId(employee.employeeNumber)}
      </p>
      <p className={`text-white ${classes.name}`}>{employee.legalName}</p>
      {nick && <p className={classes.nick}>({nick})</p>}
    </div>
  );
}
