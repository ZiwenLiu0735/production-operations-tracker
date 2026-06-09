import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `tt-nav-link inline-flex items-center ${isActive ? "tt-nav-link--active" : ""}`;

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
