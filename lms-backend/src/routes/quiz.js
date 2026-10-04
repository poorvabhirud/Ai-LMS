import express from "express";
import { supabaseAdmin, supabaseForUser } from "../config/supabaseClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { generateQuiz, generateSummary, answerDoubt, recommendCourses } from "../services/aiService.js";
import { fetchYoutubeTranscript } from "../services/youtubeService.js";

const router = express.Router();

// Resolves the best transcript source for a lecture:
// 1. Manually pasted transcript (if the teacher provided one)
// 2. Auto-fetched YouTube captions (if the video has them)
// 3. Falls back to null — caller then uses the lecture title as topic only
async function resolveTranscript(lecture) {
  if (lecture.transcript && lecture.transcript.trim().length > 0) return lecture.transcript;
  if (lecture.video_source === "youtube" && lecture.video_url) {
    return await fetchYoutubeTranscript(lecture.video_url);
  }
  return null;
}

// POST generate + save an AI quiz for a lecture (teacher only)
// Replaces any existing quiz for this lecture (handles regeneration cleanly).
router.post("/generate", requireAuth, requireRole("teacher"), async (req, res) => {
  const { lecture_id, numQuestions, difficulty } = req.body;
  try {
    const { data: lecture, error: lecErr } = await supabaseAdmin
      .from("lectures")
      .select("*")
      .eq("id", lecture_id)
      .single();
    if (lecErr || !lecture) throw new Error("Lecture not found");

    const transcript = await resolveTranscript(lecture);
    const ai = await generateQuiz({ topic: lecture.title, transcript, numQuestions, difficulty });

    // Remove any prior quiz for this lecture (cascades to its questions)
    await supabaseAdmin.from("quizzes").delete().eq("lecture_id", lecture_id);

    const { data: quiz, error: quizErr } = await supabaseAdmin
      .from("quizzes")
      .insert({ lecture_id, title: `${lecture.title} Quiz`, difficulty: difficulty || "medium" })
      .select()
      .single();
    if (quizErr) throw quizErr;

    const rows = ai.questions.map((q) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
    }));
    const { data: questions, error: qErr } = await supabaseAdmin.from("quiz_questions").insert(rows).select();
    if (qErr) throw qErr;

    res.status(201).json({ quiz, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET quiz + questions for a lecture (student taking quiz)
router.get("/lecture/:lectureId", requireAuth, async (req, res) => {
  const { data: quiz, error } = await supabaseAdmin
    .from("quizzes")
    .select("*, quiz_questions(*)")
    .eq("lecture_id", req.params.lectureId)
    .single();
  if (error) return res.status(404).json({ error: "No quiz found" });
  res.json(quiz);
});

// POST AI-generated lecture summary (any authenticated user)
// Accepts either a lecture_id (auto-resolves transcript/captions) or a raw transcript string.
router.post("/summary", requireAuth, async (req, res) => {
  try {
    let transcript = req.body.transcript;
    if (req.body.lecture_id) {
      const { data: lecture } = await supabaseAdmin.from("lectures").select("*").eq("id", req.body.lecture_id).single();
      if (lecture) transcript = await resolveTranscript(lecture);
    }
    if (!transcript) {
      return res.status(400).json({ error: "No transcript or captions available for this video." });
    }
    const summary = await generateSummary({ transcript });
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST doubt-solving chatbot (student) — stores Q&A for teacher visibility
router.post("/doubt", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const { question, courseContext, courseId, history } = req.body;
    const answer = await answerDoubt({ question, courseContext, history });

    if (courseId) {
      const client = supabaseForUser(req.token);
      await client.from("doubts").insert({
        course_id: courseId,
        student_id: req.user.id,
        question,
        answer,
      });
    }

    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all student doubts for a course (teacher only, must own the course)
router.get("/course/:courseId/doubts", requireAuth, requireRole("teacher"), async (req, res) => {
  const { data: course } = await supabaseAdmin
    .from("courses")
    .select("id, teacher_id")
    .eq("id", req.params.courseId)
    .single();

  if (!course || course.teacher_id !== req.user.id) {
    return res.status(403).json({ error: "Not your course" });
  }

  const { data, error } = await supabaseAdmin
    .from("doubts")
    .select("*, profiles(name)")
    .eq("course_id", req.params.courseId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET AI course recommendations (student)
router.get("/recommendations", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const { data: courses } = await supabaseAdmin.from("courses").select("id,title,category").eq("status", "approved");
    const { data: completed } = await supabaseAdmin
      .from("enrollments")
      .select("courses(title)")
      .eq("student_id", req.user.id);

    const result = await recommendCourses({
      studentInterests: req.query.interests || "",
      completedTitles: (completed || []).map((c) => c.courses?.title).filter(Boolean),
      availableCourses: courses || [],
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;