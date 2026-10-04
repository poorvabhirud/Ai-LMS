import { supabase } from "../supabaseClient";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body } = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),

  // Downloads a binary response (e.g. certificate PDF) and triggers a browser save.
  async downloadFile(path, filename) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Download failed");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};