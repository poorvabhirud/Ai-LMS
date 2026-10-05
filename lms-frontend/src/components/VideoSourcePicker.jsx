import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Youtube, Upload, CheckCircle2 } from "lucide-react";

// value: { video_url, video_source }
// onChange: (newValue) => void
export default function VideoSourcePicker({ value, onChange }) {
  const [mode, setMode] = useState(value.video_source === "upload" ? "upload" : "youtube");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  function switchMode(next) {
    setMode(next);
    setError("");
    if (next === "youtube") {
      onChange({ video_url: value.video_source === "youtube" ? value.video_url : "", video_source: "youtube" });
    }
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setFileName(file.name);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userData.user.id}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage.from("lecture-videos").upload(path, file);
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("lecture-videos").getPublicUrl(path);
      onChange({ video_url: data.publicUrl, video_source: "upload" });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchMode("youtube")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
            mode === "youtube" ? "border-moss bg-moss/10 text-moss" : "border-line text-ink/60"
          }`}
        >
          <Youtube size={13} /> YouTube link
        </button>
        <button
          type="button"
          onClick={() => switchMode("upload")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
            mode === "upload" ? "border-moss bg-moss/10 text-moss" : "border-line text-ink/60"
          }`}
        >
          <Upload size={13} /> Upload file
        </button>
      </div>

      {mode === "youtube" ? (
        <input
          placeholder="YouTube video URL"
          value={value.video_source === "youtube" ? value.video_url : ""}
          onChange={(e) => onChange({ video_url: e.target.value, video_source: "youtube" })}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-moss outline-none"
        />
      ) : (
        <div className="border border-dashed border-line rounded-lg p-3">
          <input
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            onChange={handleFile}
            className="w-full text-sm"
          />
          {uploading && <p className="text-xs text-signal mt-2">Uploading {fileName}…</p>}
          {!uploading && value.video_source === "upload" && value.video_url && (
            <p className="flex items-center gap-1.5 text-xs text-moss mt-2">
              <CheckCircle2 size={13} /> Uploaded{fileName ? `: ${fileName}` : ""}
            </p>
          )}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <p className="text-[11px] text-ink/40 mt-2">MP4, WebM, or MOV. Max 200MB.</p>
        </div>
      )}
    </div>
  );
}