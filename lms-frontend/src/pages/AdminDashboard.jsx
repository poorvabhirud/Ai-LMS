import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Users, GraduationCap, BookOpen, ClipboardList, Check, X, BarChart3, Star } from "lucide-react";

const sentimentColor = {
  positive: "bg-moss",
  neutral: "bg-signal",
  negative: "bg-red-400",
  unclassified: "bg-line",
};

const sentimentBadge = {
  positive: "bg-moss/10 text-moss",
  neutral: "bg-signal/10 text-signal",
  negative: "bg-red-100 text-red-600",
  unclassified: "bg-ink/5 text-ink/40",
};

function SentimentBar({ counts, total }) {
  if (total === 0) return null;
  return (
    <div className="h-2.5 rounded-full overflow-hidden flex bg-line">
      {["positive", "neutral", "negative", "unclassified"].map((s) =>
        counts[s] > 0 ? (
          <div key={s} className={sentimentColor[s]} style={{ width: `${(counts[s] / total) * 100}%` }} />
        ) : null
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [s, p, sent] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/courses/pending"),
      api.get("/admin/reviews/sentiment"),
    ]);
    setStats(s);
    setPending(p);
    setSentiment(sent);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function handleDecision(id, status) {
    await api.patch(`/courses/${id}/status`, { status });
    setPending((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">Admin dashboard</p>
      <h1 className="font-display text-3xl font-semibold mb-8">Platform overview</h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            ["Students", stats.totalStudents, "bg-moss", Users],
            ["Teachers", stats.totalTeachers, "bg-signal", GraduationCap],
            ["Live courses", stats.totalCourses, "bg-moss", BookOpen],
            ["Enrollments", stats.totalEnrollments, "bg-signal", ClipboardList],
          ].map(([label, value, accentClass, Icon]) => (
            <div key={label} className="border border-line rounded-2xl p-5 bg-white relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${accentClass}`} />
              <Icon size={16} className="text-ink/30 mb-2" />
              <p className="text-2xl font-display font-semibold">{value}</p>
              <p className="text-xs text-ink/50 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
        <ClipboardList size={18} className="text-moss" /> Pending approvals
      </h2>
      {loading && <p className="text-ink/50">Loading…</p>}
      {!loading && pending.length === 0 && <p className="text-ink/50">Nothing waiting on review.</p>}

      <div className="space-y-3 mb-14">
        {pending.map((c) => (
          <div key={c.id} className="border border-line rounded-2xl p-5 bg-white flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold">{c.title}</h3>
              <p className="text-sm text-ink/60">
                by {c.profiles?.name} · {c.category || "General"}
              </p>
              <p className="text-sm text-ink/50 mt-1 max-w-md">{c.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleDecision(c.id, "approved")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-moss text-paper text-sm hover:bg-mossdark transition"
              >
                <Check size={14} /> Approve
              </button>
              <button
                onClick={() => handleDecision(c.id, "rejected")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-line text-sm hover:border-red-400 hover:text-red-500 transition"
              >
                <X size={14} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mb-1 flex items-center gap-2">
        <BarChart3 size={18} className="text-moss" /> Review sentiment
      </h2>
      <p className="text-sm text-ink/50 mb-6">AI-classified tone across all {sentiment?.total ?? 0} written reviews.</p>

      {sentiment && sentiment.total > 0 && (
        <>
          <div className="border border-line rounded-2xl p-5 bg-white mb-6">
            <SentimentBar counts={sentiment.counts} total={sentiment.total} />
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              {Object.entries(sentiment.counts).map(([s, count]) =>
                count > 0 ? (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${sentimentColor[s]}`} />
                    <span className="capitalize text-ink/60">{s}</span>
                    <span className="text-ink/40">({count})</span>
                  </span>
                ) : null
              )}
            </div>
          </div>

          <h3 className="font-display font-semibold mb-3">By course</h3>
          <div className="space-y-2 mb-10">
            {Object.entries(sentiment.byCourse).map(([title, c]) => (
              <div key={title} className="border border-line rounded-lg p-4 bg-white">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{title}</span>
                  <span className="text-ink/40 text-xs">{c.total} reviews</span>
                </div>
                <SentimentBar counts={c} total={c.total} />
              </div>
            ))}
          </div>

          <h3 className="font-display font-semibold mb-3">Recent reviews</h3>
          <div className="space-y-2">
            {sentiment.recent.map((r) => (
              <div key={r.id} className="border border-line rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{r.courses?.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${sentimentBadge[r.sentiment || "unclassified"]}`}>
                    {r.sentiment || "unclassified"}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <Star key={idx} size={12} className="fill-signal text-signal" />
                  ))}
                </div>
                <p className="text-sm text-ink/70">{r.comment}</p>
                <p className="text-xs text-ink/40 mt-1">{r.profiles?.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {sentiment && sentiment.total === 0 && (
        <p className="text-ink/50">No written reviews yet.</p>
      )}
    </div>
  );
}