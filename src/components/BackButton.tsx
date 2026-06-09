interface BackButtonProps {
  label?: string;
  onClick: () => void;
}

export function BackButton({ label = "Back", onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tt-back-btn flex shrink-0 items-center gap-1.5"
    >
      <span aria-hidden="true" className="text-lg leading-none opacity-70">
        ←
      </span>
      {label}
    </button>
  );
}
