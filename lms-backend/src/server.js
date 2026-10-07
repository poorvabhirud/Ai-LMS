import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import coursesRouter from "./routes/courses.js";
import lecturesRouter from "./routes/lectures.js";
import quizRouter from "./routes/quiz.js";
import reviewsRouter from "./routes/reviews.js";
import adminRouter from "./routes/admin.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "https://ai-lms-rho.vercel.app"],
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "AI LMS backend running" }));

app.use("/api/courses", coursesRouter);
app.use("/api/lectures", lecturesRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/admin", adminRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));