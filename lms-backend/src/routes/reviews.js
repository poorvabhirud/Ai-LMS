import express from "express";
import { supabaseForUser } from "../config/supabaseClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { analyzeSentiment } from "../services/aiService.js";

const router = express.Router();

// POST create/update a review (student only)
router.post("/", requireAuth, requireRole("student"), async (req, res) => {
  const { course_id, rating, comment } = req.body;

  let sentiment = null;
  if (comment && comment.trim().length > 0) {
    try {
      const result = await analyzeSentiment({ comment });
      if (["positive", "neutral", "negative"].includes(result)) sentiment = result;
    } catch {
      // sentiment tagging is a nice-to-have — don't block review submission if it fails
    }
  }

  const client = supabaseForUser(req.token);
  const { data, error } = await client
    .from("reviews")
    .upsert(
      { student_id: req.user.id, course_id, rating, comment, sentiment },
      { onConflict: "student_id,course_id" }
    )
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
});

export default router;