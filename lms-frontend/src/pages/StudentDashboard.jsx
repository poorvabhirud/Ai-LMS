import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { BookOpen, Sparkles, Compass } from "lucide-react";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [enrolled, setEnrolled] = useState([]);
  const [progressByCourse, setProgressByCourse] = useState({}); // courseId -> { completed, total }
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("enrollments")
        .select("courses(*, lectures(count))")
        .eq("student_id", profile.id);
      const courses = (data || []).map((e) => e.courses).filter(Boolean);
      setEnrolled(courses);

      const progressEntries = await Promise.all(
        courses.map(async (c) => {
          try {
            const rows = await api.get(`/lectures/course/${c.id}/progress`);
            return [c.id, { completed: rows.filter((r) => r.completed).length, total: c.lectures?.[0]?.count ?? 0 }];
          } catch {
            return [c.id, { completed: 0, total: c.lectures?.[0]?.count ?? 0 }];
          }
        })
      );
      setProgressByCourse(Object.fromEntries(progressEntries));

      try {
        const r = await api.get("/quiz/recommendations");
        setRecs(r.recommendations || []);
      } catch {
        setRecs([]);
      }
      setLoading(false);
    }
    if (profile) load();
  }, [profile]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">Student dashboard</p>
      <h1 className="font-display text-3xl font-semibold mb-10">Welcome back, {profile?.name}</h1>

      <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
        <BookOpen size={18} className="text-moss" /> Your courses
      </h2>
      {loading && <p className="text-ink/50">Loading…</p>}
      {!loading && enrolled.length === 0 && (
        <p className="text-ink/50 mb-10 flex items-center gap-1.5">
          <Compass size={15} /> Not enrolled anywhere yet. <Link to="/" className="text-moss underline">Browse courses</Link>
        </p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
        {enrolled.map((c) => {
          const p = progressByCourse[c.id];
          const pct = p && p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
          return (
            <Link key={c.id} to={`/course/${c.id}`} className="border border-line rounded-2xl p-5 bg-white hover:border-moss hover:shadow-md transition">
              <h3 className="font-display font-semibold">{c.title}</h3>
              <p className="text-sm text-ink/60 mt-1 line-clamp-2 mb-3">{c.description}</p>
              {p && p.total > 0 && (
                <>
                  <div className="flex justify-between text-xs text-ink/50 mb-1">
                    <span>{pct}% complete</span>
                    <span>{p.completed}/{p.total}</span>
                  </div>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>

      {recs.length > 0 && (
        <>
          <h2 className="font-display text-xl font-semibold mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-signal" /> Suggested for you
          </h2>
          <p className="text-sm text-ink/50 mb-4">Picked by AI based on what you've completed</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {recs.map((r) => (
              <Link
                key={r.course_id}
                to={`/course/${r.course_id}`}
                className="border border-line rounded-2xl p-4 bg-white hover:border-signal transition"
              >
                <p className="text-sm text-ink/70">{r.reason}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}