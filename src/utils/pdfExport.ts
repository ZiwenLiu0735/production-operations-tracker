import { jsPDF } from "jspdf";
import JSZip from "jszip";
import type { Employee, Session, TrimCategory } from "../types";
import {
  CATEGORY_LABELS,
  getEmployeeTotals,
  getGrandTotal,
  getEntriesByCategory,
  getSessionTotals,
} from "../types";
import { employeeDisplayName, formatEmployeeId } from "./employees";
import { formatDate, formatDuration, formatTime, formatDateShort } from "./format";

const PAGE_MARGIN = 20;
const LINE_HEIGHT = 7;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sessionDateSlug(session: Session): string {
  return formatDateShort(session.startedAt);
}

function employeeReceiptFilename(employee: Employee, session: Session): string {
  return `receipt_${employee.employeeNumber}_${sessionDateSlug(session)}.pdf`;
}

function buildEmployeeReceiptPdf(
  session: Session,
  employee: Employee,
  entries: Session["entries"],
): jsPDF {
  const doc = new jsPDF();
  let y = PAGE_MARGIN;
  const categories: TrimCategory[] = ["regular", "stick", "smalls"];
  const employeeEntries = entries.filter((e) => e.employeeId === employee.id);
  const totals = getEmployeeTotals(employee.id, entries);
  const grandTotal = getGrandTotal(totals);

  function addLine(text: string, size = 11, style: "normal" | "bold" = "normal") {
    if (y > 270) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.text(text, PAGE_MARGIN, y);
    y += LINE_HEIGHT + (size > 11 ? 2 : 0);
  }

  addLine("PRODUCTION RECEIPT", 18, "bold");
  y += 4;

  addLine(`Facility: ${session.facilityName}`);
  if (session.roomName) addLine(`Room: ${session.roomName}`);
  addLine(`Date: ${formatDate(session.startedAt)}`);
  addLine(`Employee ID: ${formatEmployeeId(employee.employeeNumber)}`);
  addLine(`Employee Name: ${employeeDisplayName(employee)}`);
  y += 4;

  for (const category of categories) {
    const categoryEntries = getEntriesByCategory(employee.id, category, employeeEntries);
    const subtotal = categoryEntries.reduce((sum, e) => sum + e.weight, 0);

    addLine(CATEGORY_LABELS[category], 12, "bold");

    if (categoryEntries.length === 0) {
      addLine("  No entries", 10);
    } else {
      for (const entry of categoryEntries) {
        addLine(`  ${formatTime(entry.timestamp)}    ${entry.weight}g`, 10);
      }
    }

    addLine(`  Subtotal: ${subtotal}g`, 10, "bold");
    y += 2;
  }

  y += 2;
  addLine(`GRAND TOTAL: ${grandTotal}g`, 14, "bold");

  return doc;
}

export async function exportEmployeeReceiptPDFs(session: Session, employees: Employee[]) {
  const sessionEmployees = employees.filter((e) => session.employeeIds.includes(e.id));

  if (sessionEmployees.length === 1) {
    const employee = sessionEmployees[0];
    const doc = buildEmployeeReceiptPdf(session, employee, session.entries);
    doc.save(employeeReceiptFilename(employee, session));
    return;
  }

  const zip = new JSZip();

  for (const employee of sessionEmployees) {
    const doc = buildEmployeeReceiptPdf(session, employee, session.entries);
    const pdfBlob = doc.output("blob");
    zip.file(employeeReceiptFilename(employee, session), pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, `employee-receipts_${sessionDateSlug(session)}.zip`);
}

export function exportSessionSummaryPDF(session: Session, employees: Employee[]) {
  const doc = new jsPDF();
  let y = PAGE_MARGIN;
  const sessionEmployees = employees.filter((e) => session.employeeIds.includes(e.id));
  const sessionTotals = getSessionTotals(session.entries);
  const grandTotal = getGrandTotal(sessionTotals);

  function addLine(text: string, size = 11, style: "normal" | "bold" = "normal") {
    if (y > 270) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.text(text, PAGE_MARGIN, y);
    y += LINE_HEIGHT + (size > 11 ? 2 : 0);
  }

  addLine("SESSION SUMMARY", 18, "bold");
  y += 4;

  addLine(`Facility: ${session.facilityName}`);
  if (session.roomName) addLine(`Room: ${session.roomName}`);
  addLine(`Supervisor: ${session.supervisorName}`);
  addLine(`Date: ${formatDate(session.startedAt)}`);
  addLine(`Duration: ${formatDuration(session.startedAt, session.endedAt)}`);
  addLine(`Total Entries: ${session.entries.length}`);
  y += 4;

  addLine("Session Totals", 12, "bold");
  addLine(`  Regular Trim: ${sessionTotals.regular}g`);
  addLine(`  Stick Trim: ${sessionTotals.stick}g`);
  addLine(`  Smalls: ${sessionTotals.smalls}g`);
  addLine(`  Grand Total: ${grandTotal}g`, 11, "bold");
  y += 4;

  addLine("Employee Summary", 12, "bold");

  const sorted = [...sessionEmployees].sort((a, b) => {
    const totalA = getGrandTotal(getEmployeeTotals(a.id, session.entries));
    const totalB = getGrandTotal(getEmployeeTotals(b.id, session.entries));
    return totalB - totalA;
  });

  for (const employee of sorted) {
    const totals = getEmployeeTotals(employee.id, session.entries);
    const total = getGrandTotal(totals);
    addLine(
      `${formatEmployeeId(employee.employeeNumber)} ${employeeDisplayName(employee)}`,
      10,
      "bold",
    );
    addLine(
      `  Regular: ${totals.regular}g  Stick: ${totals.stick}g  Smalls: ${totals.smalls}g  Total: ${total}g`,
      10,
    );
  }

  const date = sessionDateSlug(session);
  const slug = (session.roomName || session.facilityName).replace(/\s+/g, "-").toLowerCase();
  doc.save(`session-summary_${slug}_${date}.pdf`);
}
