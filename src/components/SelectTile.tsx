interface SelectTileProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function SelectTile({ label, selected, onClick }: SelectTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-xl border-2 px-4 py-3 text-left text-base font-semibold transition-all active:scale-[0.98] touch-manipulation
        ${
          selected
            ? "border-brand-500 bg-brand-600/15 text-white"
            : "border-surface-600 bg-surface-800 text-white/80 hover:border-surface-500 hover:text-white"
        }`}
    >
      {label}
    </button>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">
      {children}
    </h2>
  );
}
