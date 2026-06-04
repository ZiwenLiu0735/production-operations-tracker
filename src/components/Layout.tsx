import type { ReactNode } from "react";
import { BackButton } from "./BackButton";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerCenter?: ReactNode;
  headerRight?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

export function Layout({
  children,
  title,
  subtitle,
  headerLeft,
  headerCenter,
  headerRight,
  onBack,
  backLabel,
}: LayoutProps) {
  const showHeader =
    title || subtitle || headerRight || headerCenter || onBack || headerLeft;

  return (
    <div className="flex h-full min-h-dvh flex-col bg-surface-900 text-white">
      {showHeader && (
        <header className="flex shrink-0 flex-col gap-3 border-b border-surface-600/50 bg-surface-800 px-4 py-3">
          <div className="flex items-center gap-3">
            {onBack && <BackButton label={backLabel} onClick={onBack} />}
            {headerLeft}
            {(title || subtitle) && (
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
                )}
                {subtitle && (
                  <p className="truncate text-xs text-white/50">{subtitle}</p>
                )}
              </div>
            )}
            {!title && !subtitle && headerCenter && (
              <div className="min-w-0 flex-1">{headerCenter}</div>
            )}
            {headerRight && <div className="shrink-0">{headerRight}</div>}
          </div>
          {headerCenter && (title || subtitle) && (
            <div className="w-full">{headerCenter}</div>
          )}
        </header>
      )}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
