import express from "express";
import { supabaseAdmin, supabaseForUser } from "../config/supabaseClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { streamCertificate } from "../services/certificateService.js";

const router = express.Router();

// GET all approved courses (public catalog) - supports ?limit=&offset= for pagination
router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);
  const offset = parseInt(req.query.offset) || 0;

  const { data, error, count } = await supabaseAdmin
    .from("courses")
    .select("*, lectures(count), reviews(rating), profiles(name)", { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ courses: data, total: count, limit, offset, hasMore: offset + data.length < count });
});

// GET single course with lectures
router.get("/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select("*, lectures(*), reviews(*)")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: "Course not found" });
  res.json(data);
});

// POST create course (teacher only)
router.post("/", requireAuth, requireRole("teacher"), async (req, res) => {
  const { title, description, category, thumbnail_url } = req.body;
  const client = supabaseForUser(req.token);
  const { data, error } = await client
    .from("courses")
    .insert({ title, description, category, thumbnail_url, teacher_id: req.user.id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET teacher's own courses
router.get("/mine/list", requireAuth, requireRole("teacher"), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select("*, lectures(count), enrollments(count)")
    .eq("teacher_id", req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST enroll (student only)
router.post("/:id/enroll", requireAuth, requireRole("student"), async (req, res) => {
  const client = supabaseForUser(req.token);
  const { data, error } = await client
    .from("enrollments")
    .insert({ student_id: req.user.id, course_id: req.params.id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH admin approve/reject
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  const { status } = req.body; // 'approved' | 'rejected'
  const { data, error } = await supabaseAdmin
    .from("courses")
    .update({ status })
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH edit course details (teacher only, must own the course)
router.patch("/:id", requireAuth, requireRole("teacher"), async (req, res) => {
  const { title, description, category, thumbnail_url } = req.body;
  const client = supabaseForUser(req.token);
  const { data, error } = await client
    .from("courses")
    .update({ title, description, category, thumbnail_url })
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Course not found or not yours" });
  res.json(data);
});

// DELETE a course entirely (teacher only, must own the course)
// Cascades to its lectures, quizzes, enrollments, reviews, doubts, and progress rows.
router.delete("/:id", requireAuth, requireRole("teacher"), async (req, res) => {
  const client = supabaseForUser(req.token);
  const { error, count } = await client
    .from("courses")
    .delete({ count: "exact" })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (!count) return res.status(404).json({ error: "Course not found or not yours" });
  res.json({ success: true });
});

// GET download certificate PDF (student only, must have completed every lecture — including quizzes)
router.get("/:id/certificate", requireAuth, requireRole("student"), async (req, res) => {
  const courseId = req.params.id;

  const { data: course } = await supabaseAdmin
    .from("courses")
    .select("*, lectures(id), profiles(name)")
    .eq("id", courseId)
    .single();

  if (!course) return res.status(404).json({ error: "Course not found" });

  const lectureIds = (course.lectures || []).map((l) => l.id);
  if (lectureIds.length === 0) {
    return res.status(400).json({ error: "This course has no lectures yet." });
  }

  const { data: progressRows } = await supabaseAdmin
    .from("progress")
    .select("*")
    .eq("student_id", req.user.id)
    .in("lecture_id", lectureIds);

  const completedCount = (progressRows || []).filter((p) => p.completed).length;
  if (completedCount < lectureIds.length) {
    return res.status(403).json({
      error: `Complete all lectures first (${completedCount}/${lectureIds.length} done).`,
    });
  }

  const { data: studentProfile } = await supabaseAdmin.from("profiles").select("name").eq("id", req.user.id).single();

  streamCertificate({
    res,
    studentName: studentProfile?.name || "Student",
    courseTitle: course.title,
    teacherName: course.profiles?.name || "Instructor",
    completionDate: new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
  });
});

export default router;