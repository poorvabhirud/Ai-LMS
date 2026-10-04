import dotenv from "dotenv";
dotenv.config();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile"; // free tier on Groq

function cleanJson(text) {
  return text.replace(/```json|```/g, "").trim();
}

async function chat({ system, messages, max_tokens = 1000, jsonMode = false }) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens,
      messages: system ? [{ role: "system", content: system }, ...messages] : messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Groq API request failed");
  }
  return data.choices[0].message.content;
}

// 1. QUIZ GENERATOR - takes lecture transcript/description, returns structured MCQs
export async function generateQuiz({ topic, transcript, numQuestions = 15, difficulty = "medium" }) {
  const prompt = `You are creating a multiple-choice quiz for an online course lecture.
Topic: ${topic}
${transcript ? `Lecture content:\n${transcript.slice(0, 6000)}` : "(No transcript provided — base questions on the topic name itself.)"}

Generate exactly ${numQuestions} ${difficulty}-difficulty MCQ questions testing understanding of this content.
IMPORTANT: Write the entire quiz in English, even if the lecture content above is in another language.
Respond ONLY with a JSON object in this exact format, with no extra text:
{
  "questions": [
    { "question": "...", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "..." }
  ]
}`;

  const text = await chat({ messages: [{ role: "user", content: prompt }], max_tokens: 5000, jsonMode: true });
  let parsed;
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch {
    throw new Error("AI returned malformed quiz data. Please try generating again.");
  }
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("AI did not return any questions. Please try generating again.");
  }
  return parsed;
}

// 2. AUTO-SUMMARY - condenses lecture transcript/description into a short summary
export async function generateSummary({ transcript }) {
  const prompt = `Summarize the following lecture transcript into 3-4 concise bullet points for students to review before a quiz. Write the summary in English, even if the transcript itself is in another language:\n\n${transcript.slice(0, 6000)}`;
  return chat({ messages: [{ role: "user", content: prompt }], max_tokens: 500 });
}

// 3. DOUBT-SOLVING CHATBOT - answers student questions grounded in course content
export async function answerDoubt({ question, courseContext, history = [] }) {
  const systemPrompt = `You are a helpful teaching assistant for this course. Answer student questions clearly and simply, using the course context below when relevant. Always respond in English, even if the course context is in another language. If the question is unrelated to the course, politely redirect.\n\nCourse context:\n${courseContext?.slice(0, 4000) || "N/A"}`;

  return chat({
    system: systemPrompt,
    messages: [...history, { role: "user", content: question }],
    max_tokens: 800,
  });
}

// 4. COURSE RECOMMENDATION - suggests next courses based on student's completed courses/interests
export async function recommendCourses({ studentInterests, completedTitles, availableCourses }) {
  const prompt = `Student interests: ${studentInterests || "not specified"}
Completed courses: ${completedTitles.join(", ") || "none"}
Available courses: ${availableCourses.map((c) => `${c.id}: ${c.title} (${c.category})`).join("\n")}

Recommend the top 3 most relevant course IDs for this student to take next, with a one-line reason each.
Respond ONLY with valid JSON: { "recommendations": [{ "course_id": "...", "reason": "..." }] }`;

  const text = await chat({ messages: [{ role: "user", content: prompt }], max_tokens: 500 });
  return JSON.parse(cleanJson(text));
}

// 5. REVIEW SENTIMENT - classifies course review sentiment (for admin analytics)
export async function analyzeSentiment({ comment }) {
  const prompt = `Classify the sentiment of this course review as exactly one word: positive, neutral, or negative.\nReview: "${comment}"`;
  const text = await chat({ messages: [{ role: "user", content: prompt }], max_tokens: 10 });
  return text.trim().toLowerCase();
}