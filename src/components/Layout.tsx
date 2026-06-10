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
  /** Stacks header info and actions on narrow viewports; horizontal at lg+ */
  headerLayout?: "default" | "responsive";
  /** Puts back + center on one row in portrait; tighter padding */
  headerDensity?: "default" | "compact";
  headerClassName?: string;
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
  headerLayout = "default",
  headerDensity = "default",
  headerClassName,
}: LayoutProps) {
  const showHeader =
    title || subtitle || headerRight || headerCenter || onBack || headerLeft;

  const responsiveToolbar =
    headerLayout === "responsive" && !title && !subtitle && (headerCenter || headerRight);

  return (
    <div className="flex h-full min-h-dvh flex-col bg-surface-900 text-white">
      {showHeader && (
        <header
          className={`tt-app-header flex shrink-0 flex-col gap-3 px-4 py-3 lg:px-5 ${headerClassName ?? ""} ${headerDensity === "compact" ? "tt-app-header--live-compact" : ""}`}
        >
          {responsiveToolbar ? (
            <div
              className={
                headerDensity === "compact"
                  ? "flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-4"
                  : "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4"
              }
            >
              {headerDensity === "compact" ? (
                <div className="flex min-w-0 items-center gap-2 lg:flex-1">
                  {onBack && (
                    <div className="shrink-0">
                      <BackButton label={backLabel} onClick={onBack} />
                    </div>
                  )}
                  {headerLeft}
                  {headerCenter && <div className="min-w-0 flex-1">{headerCenter}</div>}
                </div>
              ) : (
                <>
                  {onBack && (
                    <div className="shrink-0">
                      <BackButton label={backLabel} onClick={onBack} />
                    </div>
                  )}
                  {headerLeft}
                  {headerCenter && <div className="min-w-0 w-full flex-1">{headerCenter}</div>}
                </>
              )}
              {headerRight && (
                <div className="tt-live-header-actions flex w-full flex-wrap gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
                  {headerRight}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {onBack && <BackButton label={backLabel} onClick={onBack} />}
                {headerLeft}
                {(title || subtitle) && (
                  <div className="min-w-0 flex-1">
                    {title && <h1 className="tt-page-title truncate">{title}</h1>}
                    {subtitle && <p className="tt-page-subtitle truncate">{subtitle}</p>}
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
            </>
          )}
        </header>
      )}
      <main className="tt-page-content flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
