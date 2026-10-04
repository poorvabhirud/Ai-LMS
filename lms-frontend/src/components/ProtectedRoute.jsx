import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allow }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="p-10 text-center text-ink/60">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (allow && profile && !allow.includes(profile.role)) return <Navigate to="/" replace />;

  return children;
}