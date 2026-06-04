import type { TrimCategory } from "../types";
import { CATEGORY_LABELS } from "../types";

export const GRAMS_PER_LB = 454;

export function formatWeight(grams: number): string {
  return `${Math.round(grams)}g`;
}

/** Converts grams to pounds, rounded to 2 decimal places. */
export function gramsToLbs(grams: number): string {
  return (grams / GRAMS_PER_LB).toFixed(2);
}

export function formatLbs(grams: number): string {
  return `${gramsToLbs(grams)} lb`;
}

/** Summary display: grams primary, pounds secondary. */
export function formatWeightWithLbs(grams: number): string {
  const rounded = Math.round(grams);
  return `${rounded}g (${gramsToLbs(rounded)} lb)`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDuration(startedAt: number, endedAt = Date.now()): string {
  const ms = endedAt - startedAt;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function categoryLabel(category: TrimCategory): string {
  return CATEGORY_LABELS[category];
}

export function formatTimestampISO(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function parseWholeWeight(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = parseInt(trimmed, 10);
  if (parsed <= 0) return null;
  return parsed;
}
