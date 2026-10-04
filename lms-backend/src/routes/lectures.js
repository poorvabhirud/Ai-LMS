import express from "express";
import { supabaseAdmin, supabaseForUser } from "../config/supabaseClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// POST add lecture to a course (teacher only)
router.post("/", requireAuth, requireRole("teacher"), async (req, res) => {
  const { course_id, title, video_url, video_source, order_index, transcript } = req.body;
  const client = supabaseForUser(req.token);
  const { data, error } = await client
    .from("lectures")
    .insert({ course_id, title, video_url, video_source, order_index, transcript })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH mark lecture as completed (student)
// If the lecture has a quiz, completion requires an actual quiz_score — can't be marked
// watched/complete by just calling this endpoint without taking the test.
router.patch("/:id/progress", requireAuth, requireRole("student"), async (req, res) => {
  const { completed, quiz_score } = req.body;

  if (completed) {
    const { data: quiz } = await supabaseAdmin
      .from("quizzes")
      .select("id, quiz_questions(count)")
      .eq("lecture_id", req.params.id)
      .maybeSingle();

    const hasQuiz = quiz && quiz.quiz_questions?.[0]?.count > 0;
    if (hasQuiz && quiz_score === undefined) {
      return res.status(400).json({ error: "This lecture has a quiz — complete it to mark the lecture done." });
    }
  }

  const client = supabaseForUser(req.token);
  const { data, error } = await client
    .from("progress")
    .upsert(
      { student_id: req.user.id, lecture_id: req.params.id, completed, quiz_score, updated_at: new Date() },
      { onConflict: "student_id,lecture_id" }
    )
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET current student's progress across every lecture in a course
router.get("/course/:courseId/progress", requireAuth, requireRole("student"), async (req, res) => {
  const { data: lectures } = await supabaseAdmin
    .from("lectures")
    .select("id")
    .eq("course_id", req.params.courseId);

  const ids = (lectures || []).map((l) => l.id);
  if (ids.length === 0) return res.json([]);

  const client = supabaseForUser(req.token);
  const { data, error } = await client.from("progress").select("*").in("lecture_id", ids);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH edit a lecture (teacher only, must own the parent course)
router.patch("/:id", requireAuth, requireRole("teacher"), async (req, res) => {
  const { title, video_url, video_source, order_index, transcript } = req.body;
  const client = supabaseForUser(req.token);
  const { data, error } = await client
    .from("lectures")
    .update({ title, video_url, video_source, order_index, transcript })
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Lecture not found or not yours" });
  res.json(data);
});

// DELETE a lecture (teacher only, must own the parent course)
// Cascades to its quiz, quiz questions, and student progress rows.
router.delete("/:id", requireAuth, requireRole("teacher"), async (req, res) => {
  const client = supabaseForUser(req.token);
  const { error, count } = await client
    .from("lectures")
    .delete({ count: "exact" })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (!count) return res.status(404).json({ error: "Lecture not found or not yours" });
  res.json({ success: true });
});

export default router;