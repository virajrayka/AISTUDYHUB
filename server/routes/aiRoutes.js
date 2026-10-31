
const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

const TUTOR_PROMPT = `You are a friendly study tutor inside AI StudyHub.
Explain clearly in simple language, use short examples, and keep answers under 200 words.
Write in plain text. You may use **bold** for key terms and short "- " lists, but no headings, tables or code blocks unless the student asks for code.`;

// ========================================
// GROQ API FUNCTION
// ========================================

async function callGroq({
  contents,
  systemInstruction,
  json = false,
  maxOutputTokens = 2048,
}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const { default: Groq } = await import("groq-sdk");

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const model =
    process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  const messages = [];

  if (systemInstruction) {
    messages.push({
      role: "system",
      content:
        typeof systemInstruction === "string"
          ? systemInstruction
          : JSON.stringify(systemInstruction),
    });
  }

  // Convert Gemini-style chat history into Groq messages.
  if (Array.isArray(contents)) {
    for (const item of contents) {
      const role =
        item.role === "model" || item.role === "assistant"
          ? "assistant"
          : "user";

      const content = Array.isArray(item.parts)
        ? item.parts
            .map((part) => part.text || "")
            .join("\n")
        : String(item.content || "");

      if (content.trim()) {
        messages.push({ role, content });
      }
    }
  } else {
    messages.push({
      role: "user",
      content:
        typeof contents === "string"
          ? contents
          : JSON.stringify(contents),
    });
  }

  console.log(`Groq request: ${model}`);

  const response = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_completion_tokens: maxOutputTokens,
    ...(json
      ? { response_format: { type: "json_object" } }
      : {}),
  });

  const text =
    response.choices?.[0]?.message?.content || "";

  if (!text.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return text;
}

// ========================================
// JSON RESPONSE PARSER
// ========================================

function parseList(raw) {
  const clean = String(raw)
    .replace(/```json|```/g, "")
    .trim();

  const parsed = JSON.parse(clean);
  const list = Array.isArray(parsed)
    ? parsed
    : parsed?.items;

  if (!Array.isArray(list)) {
    throw new Error(
      "Groq returned an unexpected response format."
    );
  }

  return list;
}

// ========================================
// QUIZ AND FLASHCARD GENERATION
// ========================================

async function generateWithGroq(topic, type, count) {
  // ========================================
// AI STUDY PLAN GENERATION
// ========================================

async function generateStudyPlan(courses) {
  const prompt = `
Create a practical daily study plan for a student.

Student's enrolled courses:
${JSON.stringify(courses, null, 2)}

Generate 3 to 6 study tasks based on these courses.

Rules:
- Give each task a realistic time in 24-hour HH:MM format.
- Each task should have a duration such as "30 min" or "45 min".
- Prioritize courses with lower progress.
- Include revision and practice tasks.
- Avoid overlapping study sessions.
- Do not schedule tasks before 08:00 or after 22:00.
- Return only valid JSON.

Required format:
{
  "items": [
    {
      "time": "10:00",
      "title": "Revise DBMS normalization",
      "duration": "45 min",
      "done": false
    }
  ]
}
`;

  const raw = await callGroq({
    contents: prompt,
    systemInstruction:
      "You are an expert academic study planner. Create realistic and useful study schedules.",
    json: true,
    maxOutputTokens: 2048,
  });

  return parseList(raw);
}

  const subject =
    topic.toLowerCase() === "mixed"
      ? "mixed computer science topics"
      : topic;

  const prompt =
    type === "flashcards"
      ? `Create ${count} accurate educational flashcards about "${subject}".

Return ONLY a valid JSON array.
Each item must have:
{
  "question": "A clear question",
  "answer": "A concise, accurate answer"
}`
      : `Create ${count} multiple-choice quiz questions about "${subject}".

Return ONLY a valid JSON array.
Each item must have:
{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 0,
  "explanation": "Short explanation"
}

Rules:
- Exactly 4 options per question.
- Answer must be the zero-based index of the correct option.
- Options must not include letter prefixes.
- Questions must be educational and factually accurate.
- Do not repeat questions.`;

  const raw = await callGroq({
    contents: prompt,
    json: true,
    maxOutputTokens: 8192,
  });

  return parseList(raw);
}

// ========================================
// AI STUDY PLAN GENERATION
// ========================================

async function generateStudyPlan(courses) {
  const prompt = `
Create a practical daily study plan.

Enrolled courses:
${JSON.stringify(courses, null, 2)}

Generate 3 to 6 study tasks.

Rules:
- Prioritize courses with lower progress.
- Use realistic 24-hour times.
- Schedule between 08:00 and 22:00.
- Include revision and practice.
- Avoid overlapping sessions.
- Return valid JSON only.

Required format:
{
  "items": [
    {
      "time": "10:00",
      "title": "Revise DBMS normalization",
      "duration": "45 min",
      "done": false
    }
  ]
}
`;

  const raw = await callGroq({
    contents: prompt,
    systemInstruction:
      "You are an expert academic study planner. Create realistic study schedules.",
    json: true,
    maxOutputTokens: 2048,
  });

  return parseList(raw);
}

// ========================================
// AI PROVIDER STATUS
// ========================================

router.get("/status", (req, res) => {
  res.json({
    configured: Boolean(process.env.GROQ_API_KEY),
    provider: "groq",
  });
});

// ========================================
// AI TUTOR CHAT
// ========================================

router.post("/chat", async (req, res) => {
  console.log("AI CHAT ROUTE HIT:", req.body);
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        message:
          "Groq API key is not configured on the server.",
      });
    }

    const incoming = Array.isArray(req.body?.messages)
      ? req.body.messages.slice(-12)
      : [];

    const contents = incoming
      .filter(
        (m) =>
          m &&
          typeof m.text === "string" &&
          m.text.trim()
      )
      .map((m) => ({
        role:
  m.role === "ai" || m.role === "assistant"
    ? "assistant"
    : "user",
        content: m.text.slice(0, 2000),
      }));

    while (
      contents.length &&
      contents[0].role !== "user"
    ) {
      contents.shift();
    }

    if (!contents.length) {
      return res.status(400).json({
        message: "Send a question first.",
      });
    }

    const reply = await callGroq({
      contents,
      systemInstruction: TUTOR_PROMPT,
      maxOutputTokens: 2048,
    });

    return res.json({ reply });
  } catch (error) {
    console.error("AI CHAT ERROR:", error.message);

    return res.status(502).json({
      message: "AI tutor is temporarily unavailable. Please try again.",
    });
  }
});

// ========================================
// QUIZ AND FLASHCARD API
// ========================================

router.post("/generate", async (req, res) => {
  console.log("AI GENERATION REQUEST:", req.body);

  try {
    const type = String(req.body?.type || "").trim();

    const topic = String(req.body?.topic || "")
      .trim()
      .slice(0, 300);

    const count = Math.min(
      15,
      Math.max(
        1,
        Number.parseInt(req.body?.count, 10) || 5
      )
    );

    if (!["flashcards", "quiz"].includes(type)) {
      return res.status(400).json({
        message: "Type must be flashcards or quiz.",
      });
    }

    if (!topic) {
      return res.status(400).json({
        message: "Please enter a topic.",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        message:
          "Groq API key is not configured on the server.",
      });
    }

    const items = await generateWithGroq(
      topic,
      type,
      count
    );

    if (type === "flashcards") {
      const validItems = items
        .filter(
          (item) =>
            typeof item.question === "string" &&
            typeof item.answer === "string" &&
            item.question.trim() &&
            item.answer.trim()
        )
        .map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }));

      if (!validItems.length) {
        throw new Error(
          "No valid flashcards were generated."
        );
      }

      return res.json({
        items: validItems.slice(0, count),
      });
    }

    const validItems = items
      .map((item) => ({
        q: String(
          item.q ?? item.question ?? ""
        ).trim(),

        options: Array.isArray(item.options)
          ? item.options.map((option) =>
              String(option).trim()
            )
          : [],

        answer: Number(item.answer),

        explanation:
          typeof item.explanation === "string"
            ? item.explanation.trim()
            : "",
      }))
      .filter(
        (item) =>
          item.q &&
          item.options.length === 4 &&
          item.options.every(Boolean) &&
          Number.isInteger(item.answer) &&
          item.answer >= 0 &&
          item.answer < 4
      );

    if (!validItems.length) {
      throw new Error(
        "No valid quiz questions were generated."
      );
    }

    return res.json({
      items: validItems.slice(0, count),
    });

  } catch (error) {
    console.error(
      "AI GENERATION ERROR:",
      error.message
    );

    return res.status(500).json({
      message: "AI generation failed. Please try again.",
    });
  }
});

// ========================================
// AI STUDY PLANNER API
// ========================================

router.post("/plan", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        message: "Groq API key is not configured.",
      });
    }

    const courses = Array.isArray(req.body?.courses)
      ? req.body.courses.slice(0, 20)
      : [];

    if (!courses.length) {
      return res.status(400).json({
        message: "No courses provided.",
      });
    }

    const safeCourses = courses.map((course) => ({
      title: String(course.title || "Untitled course").slice(0, 150),
      progress: Math.min(
        100,
        Math.max(0, Number(course.progress) || 0)
      ),
    }));

    const items = await generateStudyPlan(safeCourses);

    const validItems = items
      .filter((item) => {
        const validTime =
          typeof item.time === "string" &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time);

        const validTitle =
          typeof item.title === "string" &&
          item.title.trim().length > 0;

        const validDuration =
          typeof item.duration === "string" &&
          item.duration.trim().length > 0;

        return validTime && validTitle && validDuration;
      })
      .map((item) => ({
        time: item.time,
        title: item.title.trim().slice(0, 150),
        duration: item.duration.trim().slice(0, 30),
        done: false,
      }))
      .slice(0, 6)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (!validItems.length) {
      throw new Error("Groq did not generate a valid study plan.");
    }

    console.log("Groq study plan generated successfully.");

    return res.json({ items: validItems });
  } catch (error) {
    console.error("AI STUDY PLAN ERROR:", error.message);

    return res.status(502).json({
      message: "Could not generate a study plan. Please try again.",
    });
  }
});

module.exports = router;
