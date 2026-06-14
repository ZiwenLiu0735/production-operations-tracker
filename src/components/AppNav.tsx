import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `tt-nav-link inline-flex items-center ${isActive ? "tt-nav-link--active" : ""}`;

export function AppNav() {
  const { employee, profile, signOut } = useAuth();

  return (
    <nav className="flex items-center gap-1" aria-label="Application navigation">
      <NavLink to="/" end className={linkClass}>
        Start Session
      </NavLink>
      <NavLink to="/archive" className={linkClass}>
        Archive
      </NavLink>
      {profile?.role === "admin" && (
        <NavLink to="/settings" className={linkClass}>
          Settings
        </NavLink>
      )}
      <span className="hidden px-2 text-xs text-white/40 xl:inline">
        {employee?.preferredName ?? employee?.legalName ?? profile?.displayName}
      </span>
      <button type="button" className="tt-nav-link" onClick={() => void signOut()}>
        Sign Out
      </button>
    </nav>
  );
}
