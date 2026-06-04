import type { ReactNode } from "react";

interface SettingsPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsPanel({ title, description, children }: SettingsPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/50">{description}</p>}
      </div>
      {children}
    </div>
  );
}

interface SettingsFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function SettingsField({ label, children, className = "" }: SettingsFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border-2 border-surface-600 bg-surface-800 px-4 py-3 text-base text-white outline-none focus:border-brand-500";

export const selectClass = inputClass;

interface SettingsCardProps {
  children: ReactNode;
}

export function SettingsCard({ children }: SettingsCardProps) {
  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800 p-4">{children}</div>
  );
}

interface ActiveToggleProps {
  active: boolean;
  onChange: (active: boolean) => void;
}

export function ActiveToggle({ active, onChange }: ActiveToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`min-h-10 rounded-lg px-4 text-sm font-semibold touch-manipulation ${
        active
          ? "bg-brand-600/20 text-brand-400"
          : "bg-surface-700 text-white/40"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </button>
  );
}
