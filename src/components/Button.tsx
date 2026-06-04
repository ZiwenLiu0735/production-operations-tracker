import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "regular" | "stick" | "smalls" | "ghost";
type ButtonSize = "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 disabled:bg-surface-600 disabled:text-white/40",
  secondary:
    "bg-surface-600 text-white hover:bg-surface-500 active:bg-surface-700 disabled:bg-surface-700 disabled:text-white/40",
  danger:
    "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 disabled:bg-surface-600 disabled:text-white/40",
  regular:
    "bg-trim-regular text-white hover:brightness-110 active:brightness-90 disabled:opacity-40",
  stick:
    "bg-trim-stick text-white hover:brightness-110 active:brightness-90 disabled:opacity-40",
  smalls:
    "bg-trim-smalls text-white hover:brightness-110 active:brightness-90 disabled:opacity-40",
  ghost:
    "bg-transparent text-white/70 hover:bg-surface-700 hover:text-white active:bg-surface-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-12 px-5 text-base font-semibold rounded-xl",
  lg: "min-h-16 px-6 text-lg font-bold rounded-2xl",
  xl: "min-h-20 px-8 text-xl font-bold rounded-2xl",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 transition-all duration-150 select-none touch-manipulation
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        disabled:pointer-events-none disabled:opacity-50
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
