import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Send, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const { resetPasswordRequest } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPasswordRequest(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm bg-white border border-line rounded-2xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-moss/10 text-moss flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={22} />
          </div>
          <h1 className="font-display text-xl font-semibold mb-3">Check your inbox</h1>
          <p className="text-ink/70 text-sm">
            If an account exists for {email}, we sent a link to reset your password.
          </p>
          <Link to="/login" className="inline-block mt-6 text-moss underline text-sm">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl shadow-sm p-8">
        <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">Reset password</p>
        <h1 className="font-display text-2xl font-semibold mb-3">Forgot your password?</h1>
        <p className="text-sm text-ink/60 mb-6">Enter your email and we'll send you a reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full border border-line rounded-lg pl-11 pr-4 py-2.5 bg-paper focus:border-moss outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-moss text-paper py-2.5 rounded-lg hover:bg-mossdark transition disabled:opacity-50 font-medium"
          >
            <Send size={16} />
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <Link to="/login" className="flex items-center gap-1.5 text-sm text-ink/60 mt-6 hover:text-ink transition">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
}