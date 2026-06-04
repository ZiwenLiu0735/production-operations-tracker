import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition-colors touch-manipulation ${
    isActive
      ? "bg-brand-600/20 text-brand-400"
      : "text-white/60 hover:bg-surface-700 hover:text-white"
  }`;

export function AppNav() {
  return (
    <nav className="flex items-center gap-1">
      <NavLink to="/" end className={linkClass}>
        Start Session
      </NavLink>
      <NavLink to="/archive" className={linkClass}>
        Archive
      </NavLink>
      <NavLink to="/settings" className={linkClass}>
        Settings
      </NavLink>
    </nav>
  );
}
