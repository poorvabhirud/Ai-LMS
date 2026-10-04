import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, KeyRound, GraduationCap, UserCog, CheckCircle2, UserPlus } from "lucide-react";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(form);
      setDone(true);
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
          <h1 className="font-display text-xl font-semibold mb-3">Check your inbox</h1>
          <p className="text-ink/70 text-sm">We sent a confirmation link to {form.email}. Confirm it, then log in.</p>
          <Link to="/login" className="inline-block mt-6 text-moss underline text-sm">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl shadow-sm p-8">
        <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">Join StackUp</p>
        <h1 className="font-display text-2xl font-semibold mb-8">Create your account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              placeholder="Full name"
              required
              className="w-full border border-line rounded-lg pl-11 pr-4 py-2.5 bg-paper focus:border-moss outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
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
              placeholder="Password (min 6 chars)"
              required
              minLength={6}
              className="w-full border border-line rounded-lg pl-11 pr-4 py-2.5 bg-paper focus:border-moss outline-none"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            {[
              { role: "student", Icon: GraduationCap },
              { role: "teacher", Icon: UserCog },
            ].map(({ role, Icon }) => (
              <button
                type="button"
                key={role}
                onClick={() => setForm({ ...form, role })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm capitalize transition ${
                  form.role === role ? "border-moss bg-moss/10 text-moss" : "border-line text-ink/60"
                }`}
              >
                <Icon size={15} /> I'm a {role}
              </button>
            ))}
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-moss text-paper py-2.5 rounded-lg hover:bg-mossdark transition disabled:opacity-50 font-medium"
          >
            <UserPlus size={16} />
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-sm text-ink/60 mt-6">
          Already have an account? <Link to="/login" className="text-moss underline">Log in</Link>
        </p>
        <p className="text-xs text-ink/40 mt-4">
          Admin accounts are created manually in Supabase (set role='admin' in the profiles table).
        </p>
      </div>
    </div>
  );
}