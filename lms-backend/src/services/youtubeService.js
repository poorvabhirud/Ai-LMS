import { YoutubeTranscript } from "youtube-transcript";

// Auto-fetches captions/subtitles from a YouTube video URL.
// Returns null if the video has no captions available (common for some uploads) —
// callers should fall back gracefully (e.g. use the lecture title as topic instead).
export async function fetchYoutubeTranscript(videoUrl) {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoUrl);
    if (!items || items.length === 0) return null;
    return items.map((i) => i.text).join(" ");
  } catch {
    return null;
  }
}