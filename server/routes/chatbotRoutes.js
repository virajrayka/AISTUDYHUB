
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const StudyData = require("../models/StudyData");

const router = express.Router();

router.use(protect);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getCourses() {
  const doc = await StudyData.findOne({
    resource: "catalog",
    ownerEmail: null,
  }).lean();

  return Array.isArray(doc?.data) ? doc.data : [];
}

// Real numbers from the database (only totals, no personal data)
async function getStats() {
  const since = { $gte: startOfToday() };

  const [
    totalUsers,
    teachers,
    students,
    usersToday,
    teachersToday,
    studentsToday,
    courses,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "teacher" }),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ createdAt: since }),
    User.countDocuments({ createdAt: since, role: "teacher" }),
    User.countDocuments({ createdAt: since, role: "student" }),
    getCourses(),
  ]);

  const approvedCourses = courses.filter(
    (c) => c.status === "approved"
  ).length;

  return {
    totalUsers,
    teachers,
    students,
    usersToday,
    teachersToday,
    studentsToday,
    totalCourses: courses.length,
    approvedCourses,
  };
}

// Local fallback for platform statistics
function keywordAnswer(message, s) {
  const text = message.toLowerCase();

  const today = text.includes("today");
  const wantsTeachers = /teacher|instructor/.test(text);
  const wantsStudents = /student|learner/.test(text);
  const wantsCourses = /course|class/.test(text);
  const wantsUsers = /user|people|member|registered|account/.test(text);

  if (wantsCourses) {
    return `There are ${s.totalCourses} courses in total (${s.approvedCourses} approved).`;
  }

  if (wantsUsers && wantsTeachers) {
    return today
      ? `${s.usersToday} users registered today, including ${s.teachersToday} teachers.`
      : `There are ${s.totalUsers} registered users: ${s.teachers} teachers and ${s.students} students.`;
  }

  if (wantsTeachers || wantsStudents || wantsUsers) {
    const kind =
      wantsTeachers && !wantsStudents
        ? "teachers"
        : wantsStudents && !wantsTeachers
          ? "students"
          : "users";

    const totals = {
      users: s.totalUsers,
      teachers: s.teachers,
      students: s.students,
    };

    const todays = {
      users: s.usersToday,
      teachers: s.teachersToday,
      students: s.studentsToday,
    };

    return today
      ? `${todays[kind]} ${kind} registered today.`
      : `There are ${totals[kind]} ${kind} registered in total.`;
  }

  return null;
}

// ========================================
// GROQ CHATBOT
// ========================================

async function askGroq(message, history, stats, user) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const { default: Groq } = await import("groq-sdk");

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const model =
    process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  const systemInstruction = `You are the assistant inside "AI StudyHub", a learning platform with students, teachers and courses.
The person chatting is ${user.name} (role: ${user.role}).

LIVE PLATFORM STATS (exact, from the database right now):
- Total registered users: ${stats.totalUsers} (teachers: ${stats.teachers}, students: ${stats.students})
- Registered today: ${stats.usersToday} users (teachers: ${stats.teachersToday}, students: ${stats.studentsToday})
- Total courses: ${stats.totalCourses} (approved: ${stats.approvedCourses})

Rules:
- For questions about these numbers, use them exactly. Never invent or estimate counts.
- If asked about platform data that is not listed above, say you don't have that information.
- Never share personal details (emails, passwords) of any user.
- Otherwise, help with study questions: explain clearly, keep answers short (under 150 words), and use simple language.`;

  const messages = [
    {
      role: "system",
      content: systemInstruction,
    },
  ];

  const past = (Array.isArray(history) ? history : [])
    .slice(-8)
    .filter(
      (m) =>
        m &&
        typeof m.text === "string" &&
        m.text.trim()
    );

  for (const item of past) {
    messages.push({
      role:
        item.role === "user"
          ? "user"
          : "assistant",
      content: item.text.slice(0, 1000),
    });
  }

  // Include the current message if it isn't already the last history message.
  const lastMessage = past[past.length - 1];

  if (
    !lastMessage ||
    lastMessage.role !== "user" ||
    lastMessage.text.trim() !== message
  ) {
    messages.push({
      role: "user",
      content: message,
    });
  }

  console.log(`Groq chatbot request: ${model}`);

  const response = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_completion_tokens: 2048,
  });

  const reply =
    response.choices?.[0]?.message?.content || "";

  if (!reply.trim()) {
    throw new Error("Groq returned an empty chatbot response.");
  }

  return reply.trim();
}

// ========================================
// CHATBOT API
// ========================================

router.post("/", async (req, res) => {
  try {
    const message = String(req.body?.message || "")
      .trim()
      .slice(0, 1000);

    if (!message) {
      return res.status(400).json({
        message: "Please type a question.",
      });
    }

    const stats = await getStats();

    if (process.env.GROQ_API_KEY) {
      try {
        const reply = await askGroq(
          message,
          req.body?.history,
          stats,
          req.user
        );
        
        return res.json({
          reply,
          source: "groq",
        });
      } catch (error) {
        console.error("GROQ CHATBOT ERROR:", error.message);
        // Fall through to the local answer below.
      }
    }

    const fallback = keywordAnswer(message, stats);

    return res.json({
      reply:
        fallback ||
        "I can answer questions like: How many users are registered? How many teachers registered today? How many courses are there?",
      source: "local",
    });
  } catch (error) {
    console.error("CHATBOT ERROR:", error);

    return res.status(500).json({
      message: "The chatbot could not answer right now.",
    });
  }
});

module.exports = router;
