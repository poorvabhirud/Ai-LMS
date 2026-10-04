import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import {
  Lock,
  ClipboardCheck,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Star,
  Send,
  BookOpen,
} from "lucide-react";

function youtubeEmbed(url) {
  const match = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function Quiz({ lectureId, onComplete, existingScore }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setQuiz(null);
    setSubmitted(false);
    setStarted(false);
    setAnswers({});
    setNotFound(false);
    api
      .get(`/quiz/lecture/${lectureId}`)
      .then(setQuiz)
      .catch(() => setNotFound(true));
  }, [lectureId]);

  if (notFound) return <p className="text-sm text-ink/40">No quiz for this lecture yet.</p>;
  if (!quiz) return <p className="text-sm text-ink/40">Loading quiz…</p>;
  if (!quiz.quiz_questions || quiz.quiz_questions.length === 0) {
    return <p className="text-sm text-ink/40">This quiz has no questions yet. Ask your teacher to regenerate it.</p>;
  }

  if (!started) {
    const hasPrevious = existingScore !== undefined && existingScore !== null;
    return (
      <div className="border border-line rounded-2xl p-8 bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-signal/10 text-signal flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck size={22} />
        </div>
        <h3 className="font-display text-lg font-semibold mb-2">{quiz.title}</h3>
        <p className="text-sm text-ink/60 mb-1">
          {quiz.quiz_questions.length} questions · {quiz.difficulty} difficulty
        </p>
        {hasPrevious && (
          <p className="text-sm text-moss font-medium mb-5">
            Your last score: {existingScore}/{quiz.quiz_questions.length}
          </p>
        )}
        {!hasPrevious && <div className="mb-5" />}
        <button
          onClick={() => setStarted(true)}
          className="px-6 py-2.5 rounded-full bg-moss text-paper hover:bg-mossdark transition font-medium"
        >
          {hasPrevious ? "Retake Test" : "Take Test"}
        </button>
      </div>
    );
  }

  const score = submitted
    ? quiz.quiz_questions.filter((q) => answers[q.id] === q.correct_index).length
    : null;

  async function handleSubmit() {
    setSubmitted(true);
    const finalScore = quiz.quiz_questions.filter((q) => answers[q.id] === q.correct_index).length;
    try {
      await api.patch(`/lectures/${lectureId}/progress`, {
        completed: true,
        quiz_score: finalScore,
      });
      onComplete?.(lectureId, finalScore);
    } catch {
      // non-fatal — score still shown to student even if save fails
    }
  }

  return (
    <div className="space-y-5">
      {quiz.quiz_questions.map((q, i) => (
        <div key={q.id} className="border border-line rounded-lg p-4 bg-white">
          <p className="font-medium mb-3">{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isCorrect = submitted && idx === q.correct_index;
              const isWrongPick = submitted && answers[q.id] === idx && idx !== q.correct_index;
              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [q.id]: idx })}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                    answers[q.id] === idx ? "border-moss" : "border-line"
                  } ${isCorrect ? "bg-moss/10 border-moss" : ""} ${isWrongPick ? "bg-red-50 border-red-300" : ""}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && <p className="text-xs text-ink/50 mt-2">{q.explanation}</p>}
        </div>
      ))}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="px-5 py-2 rounded-full bg-moss text-paper hover:bg-mossdark transition"
        >
          Submit quiz
        </button>
      ) : (
        <p className="font-medium">
          Score: {score}/{quiz.quiz_questions.length}
        </p>
      )}
    </div>
  );
}

function DoubtChat({ courseId, courseTitle, courseDescription }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const question = input;
    setInput("");
    const newHistory = [...messages, { role: "user", content: question }];
    setMessages(newHistory);
    setLoading(true);
    try {
      const res = await api.post("/quiz/doubt", {
        question,
        courseId,
        courseContext: `${courseTitle}\n${courseDescription}`,
        history: messages,
      });
      setMessages([...newHistory, { role: "assistant", content: res.answer }]);
    } catch {
      setMessages([...newHistory, { role: "assistant", content: "Sorry, couldn't get an answer right now." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-line rounded-2xl bg-white flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && <p className="text-sm text-ink/40">Ask a doubt about this course.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${
                m.role === "user" ? "bg-moss text-paper" : "bg-paper border border-line"
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-xs text-ink/40">Thinking…</p>}
      </div>
      <div className="border-t border-line p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask your doubt…"
          className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
        />
        <button onClick={send} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-moss text-paper text-sm hover:bg-mossdark transition">
          <Send size={14} />
          Send
        </button>
      </div>
    </div>
  );
}

function ReviewForm({ courseId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await api.post("/reviews", { course_id: courseId, rating, comment });
      onSubmitted();
      setComment("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-line rounded-2xl p-4 bg-white space-y-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className={n <= rating ? "text-signal" : "text-line"}>
            <Star size={22} className={n <= rating ? "fill-signal" : ""} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a review…"
        rows={2}
        className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
      />
      <button disabled={saving} onClick={submit} className="px-4 py-2 rounded-lg bg-moss text-paper text-sm hover:bg-mossdark transition disabled:opacity-50">
        {saving ? "Saving…" : "Submit review"}
      </button>
    </div>
  );
}

function Summary({ lecture }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/quiz/summary", { lecture_id: lecture.id });
      setSummary(res.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (summary) {
    return (
      <div className="border border-line rounded-2xl p-5 bg-white">
        <p className="text-xs text-signal uppercase tracking-wide mb-3 font-medium">AI summary</p>
        <div className="text-sm text-ink/80 whitespace-pre-line leading-relaxed">{summary}</div>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-2xl p-8 bg-white text-center">
      <p className="text-sm text-ink/60 mb-4">Get a quick AI-generated recap of this lecture.</p>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <button
        onClick={generate}
        disabled={loading}
        className="px-6 py-2.5 rounded-full bg-moss text-paper hover:bg-mossdark transition disabled:opacity-50"
      >
        {loading ? "Summarizing…" : "Generate summary"}
      </button>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const { session, profile } = useAuth();
  const [course, setCourse] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [tab, setTab] = useState("quiz"); // quiz | doubt | reviews
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [progressMap, setProgressMap] = useState({}); // lectureId -> { completed, quiz_score }
  const [activeLectureHasQuiz, setActiveLectureHasQuiz] = useState(false);
  const [checkingQuiz, setCheckingQuiz] = useState(true);
  const [downloadingCert, setDownloadingCert] = useState(false);

  // Non-students (teacher previewing own course, admin) always have full access
  const hasAccess = profile?.role !== "student" || isEnrolled;

  async function load() {
    const data = await api.get(`/courses/${id}`);
    setCourse(data);
    if (data.lectures?.length) setActiveLecture(data.lectures.sort((a, b) => a.order_index - b.order_index)[0]);
  }

  useEffect(() => {
    if (!activeLecture) return;
    setCheckingQuiz(true);
    api
      .get(`/quiz/lecture/${activeLecture.id}`)
      .then((q) => setActiveLectureHasQuiz(q.quiz_questions?.length > 0))
      .catch(() => setActiveLectureHasQuiz(false))
      .finally(() => setCheckingQuiz(false));
  }, [activeLecture]);

  async function loadProgress() {
    if (profile?.role !== "student" || !isEnrolled) return;
    try {
      const rows = await api.get(`/lectures/course/${id}/progress`);
      const map = {};
      rows.forEach((r) => (map[r.lecture_id] = r));
      setProgressMap(map);
    } catch {
      // non-fatal
    }
  }

  async function checkEnrollment() {
    if (!profile || profile.role !== "student") {
      setCheckingEnrollment(false);
      return;
    }
    const { data } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", profile.id)
      .eq("course_id", id)
      .maybeSingle();
    setIsEnrolled(!!data);
    setCheckingEnrollment(false);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [id]);

  useEffect(() => {
    checkEnrollment();
  }, [profile, id]);

  useEffect(() => {
    loadProgress();
  }, [isEnrolled, profile, id]);

  function handleLectureComplete(lectureId, quizScore) {
    setProgressMap((prev) => ({ ...prev, [lectureId]: { completed: true, quiz_score: quizScore } }));
  }

  async function markWatched(lectureId) {
    try {
      await api.patch(`/lectures/${lectureId}/progress`, { completed: true });
      setProgressMap((prev) => ({ ...prev, [lectureId]: { ...(prev[lectureId] || {}), completed: true } }));
    } catch {
      // non-fatal
    }
  }

  async function handleEnroll() {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      setIsEnrolled(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setEnrolling(false);
    }
  }

  async function handleDownloadCertificate() {
    setDownloadingCert(true);
    try {
      await api.downloadFile(`/courses/${id}/certificate`, `${course.title.replace(/[^a-z0-9]/gi, "-")}-certificate.pdf`);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloadingCert(false);
    }
  }

  if (!course) return <p className="p-14 text-center text-ink/50">Loading…</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-[1fr_320px] gap-8">
      <div>
        {activeLecture && hasAccess ? (
          <div className="aspect-video rounded-2xl overflow-hidden border border-line mb-4 bg-black">
            {activeLecture.video_source === "upload" ? (
              <video
                key={activeLecture.id}
                src={activeLecture.video_url}
                controls
                className="w-full h-full"
              />
            ) : (
              <iframe
                src={youtubeEmbed(activeLecture.video_url)}
                title={activeLecture.title}
                className="w-full h-full"
                allowFullScreen
              />
            )}
          </div>
        ) : activeLecture && !hasAccess ? (
          <div className="aspect-video rounded-2xl border border-line mb-4 flex flex-col items-center justify-center gap-2 bg-ink/5 text-ink/50">
            <Lock size={28} />
            <p className="text-sm">Enroll to watch this lecture</p>
          </div>
        ) : (
          <div className="aspect-video rounded-2xl border border-line mb-4 flex items-center justify-center text-ink/40">
            No lectures yet
          </div>
        )}

        <p className="text-signal text-xs uppercase tracking-wide font-medium mb-1">{course.category || "General"}</p>
        <h1 className="font-display text-2xl font-semibold mb-1">{course.title}</h1>
        <p className="text-ink/60 mb-4 whitespace-pre-wrap">{course.description}</p>

        {profile?.role === "student" && !checkingEnrollment && (
          isEnrolled ? (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <p className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-moss/10 text-moss">
                  <CheckCircle2 size={16} /> Enrolled
                </p>
                {activeLecture && !checkingQuiz && !activeLectureHasQuiz && !progressMap[activeLecture.id]?.completed && (
                  <button
                    onClick={() => markWatched(activeLecture.id)}
                    className="text-xs px-4 py-2 rounded-full border border-line text-ink/60 hover:border-moss hover:text-moss transition"
                  >
                    Mark this lecture watched
                  </button>
                )}
                {activeLecture && !checkingQuiz && activeLectureHasQuiz && !progressMap[activeLecture.id]?.completed && (
                  <span className="text-xs text-ink/40">Complete the quiz to mark this lecture done</span>
                )}
              </div>
              {course.lectures?.length > 0 && (
                <div className="max-w-xs">
                  <div className="flex justify-between text-xs text-ink/50 mb-1">
                    <span>Course progress</span>
                    <span>
                      {Object.values(progressMap).filter((p) => p.completed).length}/{course.lectures.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-signal transition-all"
                      style={{
                        width: `${
                          (Object.values(progressMap).filter((p) => p.completed).length / course.lectures.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                  {Object.values(progressMap).filter((p) => p.completed).length === course.lectures.length && (
                    <button
                      onClick={handleDownloadCertificate}
                      disabled={downloadingCert}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-signal text-paper text-sm hover:opacity-90 transition disabled:opacity-50"
                    >
                      <GraduationCap size={16} />
                      {downloadingCert ? "Preparing…" : "Download Certificate"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="px-5 py-2 rounded-full bg-moss text-paper hover:bg-mossdark transition mb-8 disabled:opacity-50"
            >
              {enrolling ? "Enrolling…" : "Enroll in this course"}
            </button>
          )
        )}

        <div className="flex gap-2 mb-4 border-b border-line">
          {["summary", "quiz", ...(profile?.role === "student" ? ["doubt"] : []), "reviews"].map((t) => {
            const tabIcon = {
              summary: <Sparkles size={14} />,
              quiz: <ClipboardCheck size={14} />,
              doubt: <MessageCircle size={14} />,
              reviews: <Star size={14} />,
            }[t];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm capitalize border-b-2 -mb-px ${
                  tab === t ? "border-moss text-moss" : "border-transparent text-ink/50"
                }`}
              >
                {tabIcon}
                {t === "doubt" ? "Ask a doubt" : t}
              </button>
            );
          })}
        </div>

        {tab === "summary" && activeLecture && session && !hasAccess && (
          <p className="text-sm text-ink/40">Enroll in this course to see the AI summary.</p>
        )}
        {tab === "summary" && activeLecture && session && hasAccess && (
          <Summary key={activeLecture.id} lecture={activeLecture} />
        )}

        {tab === "quiz" && activeLecture && session && !hasAccess && (
          <p className="text-sm text-ink/40">Enroll in this course to take the quiz.</p>
        )}
        {tab === "quiz" && activeLecture && session && hasAccess && (
          <Quiz
            lectureId={activeLecture.id}
            onComplete={handleLectureComplete}
            existingScore={progressMap[activeLecture.id]?.quiz_score}
          />
        )}

        {tab === "doubt" && profile?.role === "student" && session && !hasAccess && (
          <p className="text-sm text-ink/40">Enroll in this course to ask doubts.</p>
        )}
        {tab === "doubt" && profile?.role === "student" && session && hasAccess && (
          <DoubtChat courseId={id} courseTitle={course.title} courseDescription={course.description} />
        )}
        {tab === "reviews" && (
          <div className="space-y-4">
            {profile?.role === "student" && <ReviewForm courseId={id} onSubmitted={load} />}
            {(course.reviews || []).map((r) => (
              <div key={r.id} className="border border-line rounded-lg p-4 bg-white">
                <div className="flex gap-0.5 text-signal">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <Star key={idx} size={14} className="fill-signal text-signal" />
                  ))}
                </div>
                <p className="text-sm text-ink/70 mt-1">{r.comment}</p>
              </div>
            ))}
            {(!course.reviews || course.reviews.length === 0) && (
              <p className="text-sm text-ink/40">No reviews yet.</p>
            )}
          </div>
        )}
      </div>

      <aside>
        <h2 className="font-display font-semibold mb-3 flex items-center gap-1.5">
          <BookOpen size={16} className="text-moss" /> Lectures
        </h2>
        <div className="space-y-2">
          {(course.lectures || [])
            .sort((a, b) => a.order_index - b.order_index)
            .map((l, i) => (
              <button
                key={l.id}
                onClick={() => setActiveLecture(l)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition flex items-center justify-between ${
                  activeLecture?.id === l.id ? "border-moss bg-moss/10" : "border-line bg-white hover:border-moss/50"
                }`}
              >
                <span>
                  <span className="text-ink/40 font-mono text-xs mr-2">{String(i + 1).padStart(2, "0")}</span>
                  {l.title}
                </span>
                {progressMap[l.id]?.completed && <CheckCircle2 size={14} className="text-moss shrink-0" />}
              </button>
            ))}
        </div>
      </aside>
    </div>
  );
}