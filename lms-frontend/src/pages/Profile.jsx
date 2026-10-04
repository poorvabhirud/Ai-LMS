import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { User, Image, Save, KeyRound, CheckCircle2 } from "lucide-react";

export default function Profile() {
  const { profile, refreshProfile, updatePassword } = useAuth();
  const [form, setForm] = useState({ name: profile?.name || "", avatar_url: profile?.avatar_url || "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const { error: err } = await supabase
        .from("profiles")
        .update({ name: form.name, avatar_url: form.avatar_url })
        .eq("id", profile.id);
      if (err) throw err;
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError("");
    setPwSaved(false);
    if (pwForm.password !== pwForm.confirm) {
      setPwError("Passwords don't match.");
      return;
    }
    setPwSaving(true);
    try {
      await updatePassword(pwForm.password);
      setPwSaved(true);
      setPwForm({ password: "", confirm: "" });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  if (!profile) return <p className="p-14 text-center text-ink/50">Loading…</p>;

  return (
    <div className="max-w-lg mx-auto px-6 py-14">
      <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">Account</p>
      <h1 className="font-display text-3xl font-semibold mb-8">Your profile</h1>

      <div className="border border-line rounded-2xl p-6 bg-white mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-moss/10 overflow-hidden flex items-center justify-center shrink-0">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <User size={26} className="text-moss" />
            )}
          </div>
          <div>
            <p className="font-display font-semibold">{profile.name}</p>
            <p className="text-xs text-ink/50 capitalize">{profile.role} · {profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
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
            <Image size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              placeholder="Avatar image URL (optional)"
              className="w-full border border-line rounded-lg pl-11 pr-4 py-2.5 bg-paper focus:border-moss outline-none"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {saved && (
            <p className="flex items-center gap-1.5 text-moss text-sm">
              <CheckCircle2 size={14} /> Profile updated.
            </p>
          )}
          <button
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-moss text-paper text-sm hover:bg-mossdark transition disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="border border-line rounded-2xl p-6 bg-white">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <KeyRound size={17} className="text-moss" /> Change password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input
            type="password"
            placeholder="New password (min 6 chars)"
            required
            minLength={6}
            className="w-full border border-line rounded-lg px-4 py-2.5 bg-paper focus:border-moss outline-none"
            value={pwForm.password}
            onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            required
            minLength={6}
            className="w-full border border-line rounded-lg px-4 py-2.5 bg-paper focus:border-moss outline-none"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
          />
          {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
          {pwSaved && (
            <p className="flex items-center gap-1.5 text-moss text-sm">
              <CheckCircle2 size={14} /> Password changed.
            </p>
          )}
          <button
            disabled={pwSaving}
            className="px-5 py-2.5 rounded-full border border-line text-sm hover:border-moss hover:text-moss transition disabled:opacity-50"
          >
            {pwSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}