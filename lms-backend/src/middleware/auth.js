import { supabaseAdmin } from "../config/supabaseClient.js";

// Verifies the Supabase access token sent from frontend, attaches req.user + req.profile
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  const token = authHeader.split(" ")[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileErr || !profile) {
    return res.status(401).json({ error: "Profile not found" });
  }

  req.user = data.user;
  req.token = token;
  req.profile = profile; // contains role
  next();
}

// Usage: requireRole("teacher","admin")
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.profile.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}