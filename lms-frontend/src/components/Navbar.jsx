import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  const dashboardPath = profile?.role === "admin" ? "/admin" : profile?.role === "teacher" ? "/teacher" : "/student";

  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-mossdark">
          <span className="flex flex-col-reverse gap-[3px]" aria-hidden="true">
            <span className="block w-5 h-[3px] rounded-full bg-moss" />
            <span className="block w-3.5 h-[3px] rounded-full bg-moss" />
            <span className="block w-2 h-[3px] rounded-full bg-signal" />
          </span>
          StackUp
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/#browse-courses" className="text-ink/70 hover:text-ink">Courses</Link>
          {session ? (
            <>
              <Link to={dashboardPath} className="text-ink/70 hover:text-ink capitalize">
                {profile?.role || "dashboard"} dashboard
              </Link>
              <span className="text-ink/50">|</span>
              <Link to="/profile" className="flex items-center gap-2 font-medium text-ink hover:text-moss transition">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <User size={16} className="text-moss" />
                )}
                {profile?.name}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-line text-ink/80 hover:border-moss hover:text-moss transition"
              >
                <LogOut size={14} />
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full transition ${
                    isActive ? "bg-moss/10 text-moss font-medium" : "text-ink/70 hover:text-ink"
                  }`
                }
              >
                Log in
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full transition ${
                    isActive ? "bg-mossdark text-paper" : "bg-moss text-paper hover:bg-mossdark"
                  }`
                }
              >
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}