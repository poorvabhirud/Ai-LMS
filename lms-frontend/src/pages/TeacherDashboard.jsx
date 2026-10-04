import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Plus, Pencil, Trash2, Sparkles, ChevronDown, ChevronUp, MessageCircle, BookOpen } from "lucide-react";
import VideoSourcePicker from "../components/VideoSourcePicker";

const statusStyle = {
  approved: "bg-moss/10 text-moss",
  pending: "bg-signal/10 text-signal",
  rejected: "bg-red-100 text-red-600",
};

function LectureRow({ lecture, onUpdated, onDeleted }) {
  const [quizStatus, setQuizStatus] = useState("checking"); // checking | none | ready | generating
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: lecture.title,
    video_url: lecture.video_url,
    video_source: lecture.video_source || "youtube",
    transcript: lecture.transcript || "",
  });

  function checkQuiz() {
    setQuizStatus("checking");
    api
      .get(`/quiz/lecture/${lecture.id}`)
      .then((q) => setQuizStatus(q.quiz_questions?.length > 0 ? "ready" : "none"))
      .catch(() => setQuizStatus("none"));
  }

  useEffect(() => {
    checkQuiz();
  }, [lecture.id]);

  async function generateQuiz() {
    setQuizStatus("generating");
    setError("");
    try {
      await api.post("/quiz/generate", { lecture_id: lecture.id, numQuestions: 15, difficulty: "medium" });
      checkQuiz();
    } catch (err) {
      setError(err.message);
      setQuizStatus("none");
    }
  }

  async function saveEdit() {
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch(`/lectures/${lecture.id}`, form);
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete lecture "${lecture.title}"? This also removes its quiz and student progress.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/lectures/${lecture.id}`);
      onDeleted(lecture.id);
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="border border-line rounded-lg p-3 bg-white space-y-2">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Lecture title"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
        />
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Lecture title"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
        />
        <VideoSourcePicker
          value={{ video_url: form.video_url, video_source: form.video_source }}
          onChange={(v) => setForm({ ...form, video_url: v.video_url, video_source: v.video_source })}
        />
        <textarea
          value={form.transcript}
          onChange={(e) => setForm({ ...form, transcript: e.target.value })}
          placeholder="Transcript / notes (optional — auto-fetched from YouTube captions if left blank)"
          rows={2}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={saveEdit}
            disabled={saving}
            className="text-xs px-4 py-1.5 rounded-full bg-moss text-paper hover:bg-mossdark transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs px-4 py-1.5 rounded-full border border-line text-ink/60 hover:text-ink transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border border-line rounded-lg px-4 py-2.5 bg-paper gap-3">
      <p className="text-sm truncate">{lecture.title}</p>
      <div className="flex items-center gap-2 shrink-0">
        {error && <span className="text-xs text-red-500">{error}</span>}
        {quizStatus === "checking" && <span className="text-xs text-ink/40">Checking…</span>}
        {quizStatus === "ready" && (
          <>
            <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-moss/10 text-moss">
              <Sparkles size={12} /> Quiz ready
            </span>
            <button
              onClick={generateQuiz}
              className="text-xs px-3 py-1.5 rounded-full border border-line text-ink/60 hover:border-moss hover:text-moss transition"
            >
              Regenerate
            </button>
          </>
        )}
        {quizStatus === "generating" && (
          <span className="text-xs px-3 py-1 rounded-full bg-signal/10 text-signal">Generating…</span>
        )}
        {quizStatus === "none" && (
          <button
            onClick={generateQuiz}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-moss text-moss hover:bg-moss hover:text-paper transition"
          >
            <Sparkles size={12} /> Generate AI quiz
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-line text-ink/60 hover:border-moss hover:text-moss transition"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-line text-red-500 hover:border-red-400 transition disabled:opacity-50"
        >
          <Trash2 size={12} /> {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function AddLectureForm({ courseId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", video_url: "", video_source: "youtube", transcript: "" });

  async function submit() {
    if (!form.title || !form.video_url) {
      setError("Title and video URL are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await api.post("/lectures", { course_id: courseId, ...form });
      onAdded(created);
      setForm({ title: "", video_url: "", video_source: "youtube", transcript: "" });
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-full border border-dashed border-line text-ink/50 hover:border-moss hover:text-moss transition w-full"
      >
        <Plus size={14} /> Add lecture
      </button>
    );
  }

  return (
    <div className="border border-line rounded-lg p-3 bg-white space-y-2">
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Lecture title"
        className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
      />
      <VideoSourcePicker
        value={{ video_url: form.video_url, video_source: form.video_source }}
        onChange={(v) => setForm({ ...form, video_url: v.video_url, video_source: v.video_source })}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="text-xs px-4 py-1.5 rounded-full bg-moss text-paper hover:bg-mossdark transition disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add lecture"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs px-4 py-1.5 rounded-full border border-line text-ink/60 hover:text-ink transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DoubtsPanel({ courseId }) {
  const [doubts, setDoubts] = useState(null);

  useEffect(() => {
    api.get(`/quiz/course/${courseId}/doubts`).then(setDoubts).catch(() => setDoubts([]));
  }, [courseId]);

  if (doubts === null) return <p className="text-sm text-ink/40">Loading doubts…</p>;
  if (doubts.length === 0) return <p className="text-sm text-ink/40">No student doubts yet.</p>;

  return (
    <div className="space-y-2">
      {doubts.map((d) => (
        <div key={d.id} className="border border-line rounded-lg p-3 bg-paper text-sm">
          <p className="text-ink/50 text-xs mb-1">{d.profiles?.name || "Student"}</p>
          <p className="font-medium mb-1">Q: {d.question}</p>
          {d.answer && <p className="text-ink/70">A: {d.answer}</p>}
        </div>
      ))}
    </div>
  );
}

function CourseCard({ course, onCourseUpdated, onCourseDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [section, setSection] = useState("lectures"); // lectures | doubts
  const [editingCourse, setEditingCourse] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [courseError, setCourseError] = useState("");
  const [courseForm, setCourseForm] = useState({
    title: course.title,
    description: course.description || "",
    category: course.category || "",
    thumbnail_url: course.thumbnail_url || "",
  });

  async function toggle() {
    if (!expanded && !detail) {
      setLoadingDetail(true);
      const data = await api.get(`/courses/${course.id}`);
      setDetail(data);
      setLoadingDetail(false);
    }
    setExpanded(!expanded);
  }

  async function saveCourseEdit() {
    setSavingCourse(true);
    setCourseError("");
    try {
      const updated = await api.patch(`/courses/${course.id}`, courseForm);
      onCourseUpdated(updated);
      setEditingCourse(false);
    } catch (err) {
      setCourseError(err.message);
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleDeleteCourse() {
    if (
      !confirm(
        `Delete "${course.title}" permanently? This removes all its lectures, quizzes, enrollments, and reviews. This cannot be undone.`
      )
    )
      return;
    setDeletingCourse(true);
    try {
      await api.delete(`/courses/${course.id}`);
      onCourseDeleted(course.id);
    } catch (err) {
      alert(err.message);
      setDeletingCourse(false);
    }
  }

  function handleLectureUpdated(updated) {
    setDetail((prev) => ({ ...prev, lectures: prev.lectures.map((l) => (l.id === updated.id ? updated : l)) }));
  }

  function handleLectureDeleted(id) {
    setDetail((prev) => ({ ...prev, lectures: prev.lectures.filter((l) => l.id !== id) }));
  }

  function handleLectureAdded(created) {
    setDetail((prev) => ({ ...prev, lectures: [...(prev.lectures || []), created] }));
  }

  return (
    <div className="border border-line rounded-2xl bg-white overflow-hidden">
      <div className="w-full flex items-center justify-between p-5 gap-3">
        <button onClick={toggle} className="text-left flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg truncate">{course.title}</h3>
          <p className="text-sm text-ink/60">
            {course.lectures?.[0]?.count ?? 0} lectures · {course.category || "General"} ·{" "}
            {course.enrollments?.[0]?.count ?? 0} students enrolled
          </p>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-3 py-1 rounded-full capitalize ${statusStyle[course.status]}`}>{course.status}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingCourse((v) => !v);
            }}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-line text-ink/60 hover:border-moss hover:text-moss transition"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCourse();
            }}
            disabled={deletingCourse}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-line text-red-500 hover:border-red-400 transition disabled:opacity-50"
          >
            <Trash2 size={12} /> {deletingCourse ? "Deleting…" : "Delete"}
          </button>
          <button onClick={toggle} className="text-ink/40 px-1">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {editingCourse && (
        <div className="border-t border-line p-5 space-y-3 bg-paper">
          <input
            value={courseForm.title}
            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
            placeholder="Course title"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none bg-white"
          />
          <textarea
            value={courseForm.description}
            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none bg-white"
          />
          <div className="flex gap-3">
            <input
              value={courseForm.category}
              onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
              placeholder="Category"
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none bg-white"
            />
            <input
              value={courseForm.thumbnail_url}
              onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
              placeholder="Thumbnail URL"
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none bg-white"
            />
          </div>
          {courseError && <p className="text-xs text-red-500">{courseError}</p>}
          <div className="flex gap-2">
            <button
              onClick={saveCourseEdit}
              disabled={savingCourse}
              className="text-sm px-4 py-2 rounded-full bg-moss text-paper hover:bg-mossdark transition disabled:opacity-50"
            >
              {savingCourse ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={() => setEditingCourse(false)}
              className="text-sm px-4 py-2 rounded-full border border-line text-ink/60 hover:text-ink transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-line p-5">
          <div className="flex gap-2 mb-4">
            {["lectures", "doubts"].map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full capitalize transition ${
                  section === s ? "bg-moss/10 text-moss" : "text-ink/50 hover:text-ink"
                }`}
              >
                {s === "doubts" ? <MessageCircle size={13} /> : <BookOpen size={13} />}
                {s === "doubts" ? "Student doubts" : "Lectures"}
              </button>
            ))}
          </div>

          {section === "lectures" && (
            <div className="space-y-2">
              {loadingDetail && <p className="text-sm text-ink/40">Loading lectures…</p>}
              {detail?.lectures?.length === 0 && <p className="text-sm text-ink/40 mb-2">No lectures added yet.</p>}
              {detail?.lectures
                ?.slice()
                .sort((a, b) => a.order_index - b.order_index)
                .map((l) => (
                  <LectureRow key={l.id} lecture={l} onUpdated={handleLectureUpdated} onDeleted={handleLectureDeleted} />
                ))}
              <AddLectureForm courseId={course.id} onAdded={handleLectureAdded} />
            </div>
          )}

          {section === "doubts" && <DoubtsPanel courseId={course.id} />}
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/courses/mine/list").then(setCourses).catch(console.error).finally(() => setLoading(false));
  }, []);

  function handleCourseUpdated(updated) {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  }

  function handleCourseDeleted(id) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">Teacher dashboard</p>
          <h1 className="font-display text-3xl font-semibold">Your courses</h1>
        </div>
        <Link to="/teacher/new" className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-moss text-paper hover:bg-mossdark transition">
          <Plus size={16} /> New course
        </Link>
      </div>

      {loading && <p className="text-ink/50">Loading…</p>}
      {!loading && courses.length === 0 && (
        <p className="text-ink/50">You haven't created any courses yet.</p>
      )}

      <p className="text-xs text-ink/40 mb-3">Click a course to expand lectures, edit details, or generate AI quizzes.</p>
      <div className="space-y-3">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} onCourseUpdated={handleCourseUpdated} onCourseDeleted={handleCourseDeleted} />
        ))}
      </div>
    </div>
  );
}