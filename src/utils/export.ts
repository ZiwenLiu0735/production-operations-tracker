import type { Employee, Session } from "../types";
import { CATEGORY_LABELS } from "../types";
import { employeeDisplayName } from "./employees";
import { formatTimestampISO } from "./format";

interface RawCsvRow {
  timestamp: string;
  facility: string;
  room: string;
  employee_id: number;
  employee_name: string;
  category: string;
  weight: number;
}

function buildRawCsvRows(session: Session, employees: Employee[]): RawCsvRow[] {
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  return [...session.entries]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((entry) => {
      const employee = employeeMap.get(entry.employeeId);
      return {
        timestamp: formatTimestampISO(entry.timestamp),
        facility: session.facilityName,
        room: session.roomName ?? "",
        employee_id: employee?.employeeNumber ?? 0,
        employee_name: employee ? employeeDisplayName(employee) : "",
        category: CATEGORY_LABELS[entry.category],
        weight: entry.weight,
      };
    });
}

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sessionFilename(session: Session, extension: string): string {
  const date = new Date(session.startedAt).toISOString().slice(0, 10);
  const slug = (session.roomName || session.facilityName)
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `trim-raw-data_${slug}_${date}.${extension}`;
}

export function exportRawDataCSV(session: Session, employees: Employee[]) {
  const rows = buildRawCsvRows(session, employees);
  const headers = [
    "timestamp",
    "facility",
    "room",
    "employee_id",
    "employee_name",
    "category",
    "weight",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeCsvField(row[h as keyof RawCsvRow])).join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, sessionFilename(session, "csv"));
}

export function getRecentEntries(
  entries: Session["entries"],
  limit = 20,
): Session["entries"] {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
