import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { BookOpen, Plus, Trash2, Send, Info } from "lucide-react";
import VideoSourcePicker from "../components/VideoSourcePicker";

export default function CreateCourse() {
  const navigate = useNavigate();
  const [course, setCourse] = useState({ title: "", description: "", category: "", thumbnail_url: "" });
  const [lectures, setLectures] = useState([{ title: "", video_url: "", video_source: "youtube", transcript: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateLecture(i, field, value) {
    const copy = [...lectures];
    copy[i][field] = value;
    setLectures(copy);
  }

  function updateLectureVideo(i, videoValue) {
    const copy = [...lectures];
    copy[i].video_url = videoValue.video_url;
    copy[i].video_source = videoValue.video_source;
    setLectures(copy);
  }

  function addLectureRow() {
    setLectures([...lectures, { title: "", video_url: "", video_source: "youtube", transcript: "" }]);
  }

  function removeLectureRow(i) {
    setLectures(lectures.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const createdCourse = await api.post("/courses", course);

      for (let i = 0; i < lectures.length; i++) {
        const l = lectures[i];
        if (!l.title || !l.video_url) continue;
        await api.post("/lectures", {
          course_id: createdCourse.id,
          title: l.title,
          video_url: l.video_url,
          video_source: l.video_source || "youtube",
          order_index: i,
          transcript: l.transcript,
        });
      }

      navigate("/teacher");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <p className="text-signal text-sm tracking-wide uppercase mb-2 font-medium">New course</p>
      <h1 className="font-display text-3xl font-semibold mb-8">Create a course</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4 border border-line rounded-2xl p-5 bg-white">
          <input
            placeholder="Course title"
            required
            className="w-full border border-line rounded-lg px-4 py-2.5 focus:border-moss outline-none"
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            rows={3}
            className="w-full border border-line rounded-lg px-4 py-2.5 focus:border-moss outline-none"
            value={course.description}
            onChange={(e) => setCourse({ ...course, description: e.target.value })}
          />
          <div className="flex gap-3">
            <input
              placeholder="Category (e.g. Web Development)"
              className="flex-1 border border-line rounded-lg px-4 py-2.5 focus:border-moss outline-none"
              value={course.category}
              onChange={(e) => setCourse({ ...course, category: e.target.value })}
            />
            <input
              placeholder="Thumbnail image URL (optional)"
              className="flex-1 border border-line rounded-lg px-4 py-2.5 focus:border-moss outline-none"
              value={course.thumbnail_url}
              onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
            />
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen size={18} className="text-moss" /> Lectures
          </h2>
          <div className="space-y-4">
            {lectures.map((l, i) => (
              <div key={i} className="border border-line rounded-2xl p-4 bg-white space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink/40 font-mono">Lecture {i + 1}</span>
                  {lectures.length > 1 && (
                    <button type="button" onClick={() => removeLectureRow(i)} className="flex items-center gap-1 text-xs text-red-500">
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>
                <input
                  placeholder="Lecture title"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
                  value={l.title}
                  onChange={(e) => updateLecture(i, "title", e.target.value)}
                />
                <VideoSourcePicker
                  value={{ video_url: l.video_url, video_source: l.video_source }}
                  onChange={(v) => updateLectureVideo(i, v)}
                />
                <textarea
                  placeholder="Transcript / notes (used by AI to generate quizzes — paste video script or summary; auto-fetched from captions if left blank for YouTube videos)"
                  rows={2}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
                  value={l.transcript}
                  onChange={(e) => updateLecture(i, "transcript", e.target.value)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLectureRow}
            className="mt-3 flex items-center gap-1.5 text-sm text-moss underline"
          >
            <Plus size={14} /> Add another lecture
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-moss text-paper py-2.5 rounded-lg hover:bg-mossdark transition disabled:opacity-50"
        >
          <Send size={16} />
          {loading ? "Creating…" : "Submit for approval"}
        </button>
        <p className="text-xs text-ink/40 -mt-4 flex items-center gap-1">
          <Info size={12} /> Course goes live after admin approval.
        </p>
      </form>
    </div>
  );
}