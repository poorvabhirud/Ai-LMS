import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, KeyRound, LogIn } from "lucide-react";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl shadow-sm p-8">
        <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">Welcome back</p>
        <h1 className="font-display text-2xl font-semibold mb-8">Log in to StackUp</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full border border-line rounded-lg pl-11 pr-4 py-2.5 bg-paper focus:border-moss outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="relative">
            <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full border border-line rounded-lg pl-11 pr-4 py-2.5 bg-paper focus:border-moss outline-none"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="text-right -mt-1">
            <Link to="/forgot-password" className="text-xs text-moss hover:underline">Forgot password?</Link>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-moss text-paper py-2.5 rounded-lg hover:bg-mossdark transition disabled:opacity-50 font-medium"
          >
            <LogIn size={16} />
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="text-sm text-ink/60 mt-6">
          No account? <Link to="/signup" className="text-moss underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}