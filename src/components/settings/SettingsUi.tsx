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
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/55">{description}</p>}
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
      <span className="tt-section-label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "tt-input";

export const selectClass = inputClass;

interface SettingsCardProps {
  children: ReactNode;
}

export function SettingsCard({ children }: SettingsCardProps) {
  return <div className="tt-settings-card">{children}</div>;
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
      className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors touch-manipulation ${
        active
          ? "bg-brand-600/20 text-brand-400"
          : "bg-surface-700 text-white/40"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </button>
  );
}
