import express from "express";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

// GET all users
router.get("/users", async (req, res) => {
  const { data, error } = await supabaseAdmin.from("profiles").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET pending courses (awaiting approval)
router.get("/courses/pending", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select("*, profiles(name,email)")
    .eq("status", "pending");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET dashboard stats
router.get("/stats", async (req, res) => {
  const [{ count: totalStudents }, { count: totalTeachers }, { count: totalCourses }, { count: totalEnrollments }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabaseAdmin.from("courses").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabaseAdmin.from("enrollments").select("*", { count: "exact", head: true }),
    ]);
  res.json({ totalStudents, totalTeachers, totalCourses, totalEnrollments });
});

// GET review sentiment analytics (overall counts + per-course breakdown + recent reviews)
router.get("/reviews/sentiment", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, comment, sentiment, created_at, courses(title), profiles(name)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const counts = { positive: 0, neutral: 0, negative: 0, unclassified: 0 };
  const byCourse = {};

  data.forEach((r) => {
    const s = ["positive", "neutral", "negative"].includes(r.sentiment) ? r.sentiment : "unclassified";
    counts[s]++;

    const courseTitle = r.courses?.title || "Unknown course";
    if (!byCourse[courseTitle]) byCourse[courseTitle] = { positive: 0, neutral: 0, negative: 0, unclassified: 0, total: 0 };
    byCourse[courseTitle][s]++;
    byCourse[courseTitle].total++;
  });

  res.json({ total: data.length, counts, byCourse, recent: data.slice(0, 15) });
});

export default router;