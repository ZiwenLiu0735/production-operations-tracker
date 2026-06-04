interface BackButtonProps {
  label?: string;
  onClick: () => void;
}

export function BackButton({ label = "Back", onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-base font-semibold text-white/70 transition-colors active:bg-surface-700 active:text-white"
    >
      <span aria-hidden="true" className="text-lg leading-none">
        ←
      </span>
      {label}
    </button>
  );
}
