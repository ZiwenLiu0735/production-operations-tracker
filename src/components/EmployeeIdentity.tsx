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
    name: "text-sm font-semibold",
    nick: "text-xs",
  },
  card: {
    id: "text-2xl font-bold",
    name: "text-base font-semibold",
    nick: "text-sm",
  },
  md: {
    id: "text-2xl font-bold",
    name: "text-base font-semibold",
    nick: "text-sm",
  },
  lg: {
    id: "text-4xl font-bold",
    name: "text-2xl font-semibold",
    nick: "text-lg",
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
        <p className={`tt-employee-id ${classes.id}`}>
          {formatEmployeeId(employee.employeeNumber)}
        </p>
        <p className={`tt-employee-name ${classes.name}`}>{employeeDisplayName(employee)}</p>
      </div>
    );
  }

  return (
    <div className={alignClass}>
      <p className={`tt-employee-id ${classes.id}`}>
        {formatEmployeeId(employee.employeeNumber)}
      </p>
      <p className={`tt-employee-name ${classes.name}`}>{employee.legalName}</p>
      {nick && <p className={`tt-employee-nick ${classes.nick}`}>({nick})</p>}
    </div>
  );
}
