import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { Trophy, Sparkles, MessageCircle, PlayCircle, Search, Star, ArrowRight, BookOpen } from "lucide-react";
import fundamentalsImg from "../assets/hero/fundamentals.png";
import practiceImg from "../assets/hero/practice.png";
import realProjectsImg from "../assets/hero/real-projects.png";

function avgRating(reviews) {
  if (!reviews?.length) return null;
  return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
}

function ContinueLearning() {
  const { profile } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    async function load() {
      if (!profile || profile.role !== "student") {
        setItems([]);
        return;
      }
      const { data } = await supabase
        .from("enrollments")
        .select("courses(*, lectures(count))")
        .eq("student_id", profile.id);

      const courses = (data || []).map((e) => e.courses).filter(Boolean);

      const withProgress = await Promise.all(
        courses.map(async (c) => {
          try {
            const rows = await api.get(`/lectures/course/${c.id}/progress`);
            const total = c.lectures?.[0]?.count ?? 0;
            const completed = rows.filter((r) => r.completed).length;
            return { course: c, completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
          } catch {
            return { course: c, completed: 0, total: c.lectures?.[0]?.count ?? 0, pct: 0 };
          }
        })
      );

      setItems(withProgress.filter((x) => x.pct < 100).sort((a, b) => b.pct - a.pct));
    }
    load();
  }, [profile]);

  if (!profile || profile.role !== "student") return null;
  if (items === null) return null;
  if (items.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 pt-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold mb-1 text-ink">Jump back in</h2>
          <p className="text-sm text-ink/60">Pick up right where you left off.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {items.map(({ course, completed, total, pct }) => (
          <div key={course.id} className="border border-line/80 rounded-2xl p-6 bg-white flex flex-col shadow-sm hover:shadow-md transition duration-300">
            <h3 className="font-display text-lg font-semibold mb-2">{course.title}</h3>
            <p className="text-sm text-ink/50 line-clamp-2 mb-6">{course.description}</p>

            <div className="mt-auto bg-paper rounded-xl p-4 border border-line/40">
              <div className="flex justify-between text-xs font-semibold text-ink/70 mb-2">
                <span>{pct === 0 ? "Not started" : `${pct}% complete`}</span>
                <span>{completed} / {total} lessons</span>
              </div>
              <div className="h-2 bg-line/80 rounded-full overflow-hidden mb-5">
                <div className="h-full bg-signal rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>

              <Link
                to={`/course/${course.id}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-moss text-paper text-sm font-medium hover:bg-mossdark transition-colors"
              >
                {pct === 0 ? "Start course" : "Continue learning"}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { session } = useAuth();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const PAGE_SIZE = 12;
  const isFiltering = query.trim().length > 0 || activeCategory !== "All";

  async function loadPage(currentOffset) {
    const res = await api.get(`/courses?limit=${PAGE_SIZE}&offset=${currentOffset}`);
    setCourses((prev) => (currentOffset === 0 ? res.courses : [...prev, ...res.courses]));
    setOffset(currentOffset + res.courses.length);
    setHasMore(res.hasMore);
    setTotal(res.total);
    return res.hasMore;
  }

  useEffect(() => {
    loadPage(0)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      await loadPage(offset);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }

  // When the person searches/filters, pull in the rest of the catalog so results aren't
  // limited to whatever page happened to be loaded already.
  useEffect(() => {
    if (!isFiltering || !hasMore || loadingMore) return;
    let cancelled = false;
    async function loadRemaining() {
      setLoadingMore(true);
      let currentOffset = offset;
      let more = hasMore;
      while (more && !cancelled) {
        more = await loadPage(currentOffset);
        currentOffset += PAGE_SIZE;
      }
      if (!cancelled) setLoadingMore(false);
    }
    loadRemaining().catch(console.error);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFiltering]);

  useEffect(() => {
    if (location.hash === "#browse-courses") {
      const scrollToSection = () => document.getElementById("browse-courses")?.scrollIntoView({ behavior: "smooth" });
      scrollToSection();
      const retry = setTimeout(scrollToSection, 400);
      return () => clearTimeout(retry);
    }
  }, [location, courses]);

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [courses]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesCategory = activeCategory === "All" || c.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q || c.title.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [courses, query, activeCategory]);

  return (
    <div className="bg-paper/30 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="border-b border-line bg-white overflow-hidden relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center relative z-10">

          {/* Left Column: Typography & Search */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal/10 text-signal text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} />
              <span>Skills, Stacked</span>
            </div>

            {/* Added whitespace-nowrap and removed the <br /> */}
            <h1 className="font-display text-5xl md:text-6xl font-extrabold mb-6 text-ink tracking-tight leading-[1.1] whitespace-nowrap">
              Stack up your skills,<br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-moss to-[#4FA89C]">one course at a time.</span>
            </h1>

            {/* Added whitespace-nowrap and removed max-w-md */}
            <p className="text-ink/60 text-lg mb-10 leading-relaxed whitespace-nowrap">
              Real lectures, AI-generated quizzes after every <br />video, and a teacher on the other end of every <br />doubt — built to keep you moving forward.
            </p>

            <div className="relative max-w-md group">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-ink/40 group-focus-within:text-moss transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses — try “Python” or “Web Dev”…"
                className="w-full border-2 border-line/80 rounded-2xl pl-14 pr-5 py-4 bg-white focus:border-moss outline-none text-base transition-all shadow-sm focus:shadow-md"
              />
            </div>

            {!session && (
              <p className="text-sm text-ink/50 mt-5 font-medium">
                <Link to="/signup" className="text-moss font-bold hover:text-mossdark transition-colors underline decoration-2 underline-offset-4">Sign up</Link> to track progress and get AI recommendations.
              </p>
            )}
          </div>

          {/* Right Column: Visual Hero Stack */}
          <div className="hidden lg:flex justify-end relative h-[480px]">
            {/* Fixed Container for perfect absolute positioning. */}
            <div className="relative w-[460px] h-full">

              {/* STAIRCASE BLOCKS */}
              {/* 4. Mastery */}
              <div
                className="absolute flex items-center gap-4 w-[260px] rounded-2xl px-5 py-4 bg-signal text-paper shadow-2xl border-[3px] border-white z-10 transition-transform hover:-translate-y-2 cursor-default"
                style={{ top: '20px', right: '0px' }}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  <Trophy size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Next up</p>
                  <p className="font-display font-bold text-base">Mastery</p>
                </div>
              </div>

              {/* 3. Real Projects */}
              <div
                className="absolute flex items-center gap-4 w-[260px] rounded-2xl px-5 py-4 bg-[#4FA89C] text-paper shadow-2xl border-[3px] border-white z-20 transition-transform hover:-translate-y-2 cursor-default"
                style={{ top: '100px', right: '50px' }}
              >
                <div className="w-12 h-12 rounded-full bg-white/90 overflow-hidden shrink-0 shadow-inner p-1.5">
                  {realProjectsImg ? <img src={realProjectsImg} alt="Real Projects" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-slate-200 rounded-full" />}
                </div>
                <p className="font-display font-bold text-base">Real projects</p>
              </div>

              {/* 2. Practice */}
              <div
                className="absolute flex items-center gap-4 w-[260px] rounded-2xl px-5 py-4 bg-moss text-paper shadow-2xl border-[3px] border-white z-30 transition-transform hover:-translate-y-2 cursor-default"
                style={{ top: '180px', right: '100px' }}
              >
                <div className="w-12 h-12 rounded-full bg-white/90 overflow-hidden shrink-0 shadow-inner p-1.5">
                  {practiceImg ? <img src={practiceImg} alt="Practice" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-slate-200 rounded-full" />}
                </div>
                <p className="font-display font-bold text-base">Practice</p>
              </div>

              {/* 1. Fundamentals */}
              <div
                className="absolute flex items-center gap-4 w-[260px] rounded-2xl px-5 py-4 bg-mossdark text-paper shadow-2xl border-[3px] border-white z-40 transition-transform hover:-translate-y-2 cursor-default"
                style={{ top: '260px', right: '150px' }}
              >
                <div className="w-12 h-12 rounded-full bg-white/90 overflow-hidden shrink-0 shadow-inner p-1.5">
                  {fundamentalsImg ? <img src={fundamentalsImg} alt="Fundamentals" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-slate-200 rounded-full" />}
                </div>
                <p className="font-display font-bold text-base">Fundamentals</p>
              </div>

              {/* FLOATING BADGES */}
              <div className="absolute top-[50px] left-[-20px] bg-white border border-line/40 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 z-50">
                <div className="w-8 h-8 rounded-full bg-signal/10 text-signal flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <span className="text-sm font-bold text-ink/80">AI Quizzes</span>
              </div>

              <div className="absolute top-[220px] right-[-40px] bg-white border border-line/40 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 z-50">
                <div className="w-8 h-8 rounded-full bg-moss/10 text-moss flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                <span className="text-sm font-bold text-ink/80">Teacher Support</span>
              </div>

              {/* Changed right-[40px] to left-[-40px] to move it to the left */}
              <div className="absolute bottom-[60px] left-[-40px] bg-white border border-line/40 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 z-50">
                <div className="w-8 h-8 rounded-full bg-[#4FA89C]/10 text-[#4FA89C] flex items-center justify-center">
                  <PlayCircle size={16} />
                </div>
                <span className="text-sm font-bold text-ink/80">HD Lectures</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      <ContinueLearning />

      {/* Catalog Section */}
      <div id="browse-courses" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="font-display text-3xl font-extrabold mb-2 text-ink">Browse the Catalog</h2>
            <p className="text-ink/60 font-medium">{total} course{total !== 1 ? "s" : ""} available to kickstart your journey</p>
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-sm px-5 py-2 rounded-xl transition-all font-semibold ${
                    activeCategory === cat
                      ? "bg-ink text-paper shadow-md scale-105"
                      : "bg-white border border-line text-ink/70 hover:border-ink hover:text-ink"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-moss/30 border-t-moss rounded-full animate-spin" />
            <p className="text-ink/50 font-medium">Loading courses…</p>
          </div>
        )}

        {/* Empty States */}
        {!loading && courses.length === 0 && (
          <div className="py-20 text-center text-ink/50 bg-white border-2 border-dashed border-line rounded-3xl font-medium">
            No approved courses yet. Check back soon.
          </div>
        )}

        {!loading && courses.length > 0 && filtered.length === 0 && (
          <div className="py-20 text-center text-ink/50 bg-white border-2 border-dashed border-line rounded-3xl font-medium">
            No courses match "{query}". Try a different search.
          </div>
        )}

        {/* Course Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.map((c, i) => (
            <Link
              to={`/course/${c.id}`}
              key={c.id}
              className="group bg-white border border-line/60 rounded-3xl overflow-hidden hover:border-moss/50 hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1.5"
            >
              <div className="aspect-video w-full overflow-hidden relative">
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-gradient-to-br from-moss to-[#4FA89C] items-center justify-center ${c.thumbnail_url ? "hidden" : "flex"}`}
                >
                  <BookOpen size={36} className="text-paper/70" />
                </div>
                <span className="absolute top-3 right-3 text-xs px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur font-bold uppercase tracking-wider text-moss shadow-sm">
                  {c.category || "General"}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink/30 font-mono font-bold">{String(i + 1).padStart(2, "0")}</span>
                  {c.profiles?.name && (
                    <span className="text-xs text-ink/50 font-medium">by {c.profiles.name}</span>
                  )}
                </div>

                <h3 className="font-display text-xl font-bold mb-3 text-ink group-hover:text-moss transition-colors line-clamp-2">
                  {c.title}
                </h3>

                <p className="text-sm text-ink/60 line-clamp-3 mb-8 leading-relaxed">
                  {c.description}
                </p>

                <div className="mt-auto pt-5 border-t border-line/40 flex items-center justify-between text-sm text-ink/70 font-semibold">
                  <span className="flex items-center gap-2">
                    <PlayCircle size={18} className="text-moss/70" />
                    {c.lectures?.[0]?.count ?? 0} lessons
                  </span>
                  <span className="flex items-center gap-1.5">
                    {avgRating(c.reviews) ? (
                      <>
                        <Star size={16} className="fill-signal text-signal" />
                        {avgRating(c.reviews)}
                      </>
                    ) : (
                      <span className="text-ink/40">New</span>
                    )}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && !isFiltering && hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-full border border-line text-sm font-semibold text-ink/70 hover:border-moss hover:text-moss transition disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : `Load more (${courses.length}/${total})`}
            </button>
          </div>
        )}

        {isFiltering && loadingMore && (
          <p className="text-center text-xs text-ink/40 mt-6">Searching the full catalog…</p>
        )}
      </div>
    </div>
  );
}