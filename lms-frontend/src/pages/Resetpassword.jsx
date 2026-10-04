import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { KeyRound, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm bg-white border border-line rounded-2xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-moss/10 text-moss flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={22} />
          </div>
          <h1 className="font-display text-xl font-semibold mb-3">Password updated</h1>
          <p className="text-ink/70 text-sm">Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl shadow-sm p-8">
        <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">Reset password</p>
        <h1 className="font-display text-2xl font-semibold mb-8">Choose a new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              required
              minLength={6}
              className="w-full border border-line rounded-lg pl-11 pr-4 py-2.5 bg-paper focus:border-moss outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="relative">
            <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="password"
              placeholder="Confirm new password"
              required
              minLength={6}
              className="w-full border border-line rounded-lg pl-11 pr-4 py-2.5 bg-paper focus:border-moss outline-none"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="w-full bg-moss text-paper py-2.5 rounded-lg hover:bg-mossdark transition disabled:opacity-50 font-medium"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
        <p className="text-xs text-ink/40 mt-4">
          This link only works if you got here from a password reset email. If it's not working,{" "}
          <Link to="/forgot-password" className="text-moss underline">request a new one</Link>.
        </p>
      </div>
    </div>
  );
}