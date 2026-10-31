// Local "AI" helpers used until a real AI provider (OpenAI, Gemini, Claude...) is connected.
// Every function returns plain data, so each one can later be replaced by an API call.

import { apiRequest } from "./store";

const BANK = {
  DBMS: {
    explain: "A DBMS stores data in tables. Normalization (1NF → 2NF → 3NF) removes duplication and update anomalies, primary keys identify rows uniquely, and SQL is used to query and change the data.",
    questions: [
      { q: "Which normal form removes repeating groups and requires atomic values?", options: ["1NF", "2NF", "3NF", "BCNF"], answer: 0 },
      { q: "Which SQL clause filters rows after GROUP BY?", options: ["WHERE", "HAVING", "ORDER BY", "LIMIT"], answer: 1 },
      { q: "What does a primary key guarantee?", options: ["Unique, non-null row identity", "Faster inserts", "Encrypted data", "Duplicate rows"], answer: 0 },
      { q: "Which normal form removes partial dependencies on a composite key?", options: ["1NF", "2NF", "3NF", "BCNF"], answer: 1 },
    ],
    cards: [
      { front: "What is normalization?", back: "A design process that reduces redundancy and update anomalies." },
      { front: "What is a primary key?", back: "A column (or set of columns) that uniquely identifies each row." },
      { front: "What is a foreign key?", back: "A column that references the primary key of another table." },
    ],
  },
  React: {
    explain: "React builds UIs from components. useState stores local state, useEffect runs side effects such as data fetching, and props pass data from parent to child. Lists need a stable key.",
    questions: [
      { q: "Which Hook is used for local component state?", options: ["useState", "useRoute", "useClass", "useDOM"], answer: 0 },
      { q: "Which Hook runs side effects such as data fetching?", options: ["useEffect", "useState", "useRef", "useId"], answer: 0 },
      { q: "Why does React need a key prop in lists?", options: ["To identify items between renders", "To style items", "To encrypt data", "To sort the list"], answer: 0 },
      { q: "Which package provides client-side routing in this project?", options: ["react-router-dom", "express", "mongoose", "bcryptjs"], answer: 0 },
    ],
    cards: [
      { front: "What is a React component?", back: "A reusable UI building block that returns React elements." },
      { front: "What does useEffect do?", back: "Runs side effects after render, such as fetching data or subscribing to events." },
      { front: "What are props?", back: "Read-only inputs passed from a parent component to a child." },
    ],
  },
  Java: {
    explain: "Java is an object-oriented language that compiles to bytecode for the JVM. The four OOP pillars are encapsulation, inheritance, polymorphism and abstraction.",
    questions: [
      { q: "Which principle lets one interface represent different underlying forms?", options: ["Encapsulation", "Polymorphism", "Compilation", "Serialization"], answer: 1 },
      { q: "Which keyword is used to inherit a class in Java?", options: ["implements", "extends", "inherits", "super"], answer: 1 },
      { q: "Which collection does not allow duplicate elements?", options: ["ArrayList", "LinkedList", "HashSet", "Vector"], answer: 2 },
      { q: "What does the JVM execute?", options: ["Source code", "Bytecode", "SQL", "HTML"], answer: 1 },
    ],
    cards: [
      { front: "What is polymorphism?", back: "One interface or type representing different underlying forms." },
      { front: "What is encapsulation?", back: "Bundling data with the methods that use it and hiding internal details." },
      { front: "What is the JVM?", back: "The Java Virtual Machine that runs compiled Java bytecode." },
    ],
  },
  ML: {
    explain: "Machine learning finds patterns in data. Supervised learning uses labelled examples (regression, classification), unsupervised learning finds structure in unlabelled data (clustering), and models are judged on unseen test data.",
    questions: [
      { q: "Which algorithm is supervised learning?", options: ["K-Means", "PCA", "Linear Regression", "Apriori"], answer: 2 },
      { q: "What is overfitting?", options: ["Memorizing training data and generalizing poorly", "A model that is too small", "Training that never ends", "Data with no labels"], answer: 0 },
      { q: "Which technique groups unlabelled data?", options: ["Clustering", "Regression", "Classification", "Backpropagation"], answer: 0 },
      { q: "Why split data into train and test sets?", options: ["To evaluate on unseen data", "To train faster", "To remove features", "To label data"], answer: 0 },
    ],
    cards: [
      { front: "What is supervised learning?", back: "Learning from labelled examples to predict outputs for new inputs." },
      { front: "What is overfitting?", back: "When a model memorizes training data and performs poorly on new data." },
      { front: "What is feature engineering?", back: "Creating or transforming input variables so a model can learn better." },
    ],
  },
  Web: {
    explain: "Web apps talk to servers over HTTP. GET reads data, POST creates it, and status codes such as 200 and 404 describe the result. CORS controls which browser origins may call an API.",
    questions: [
      { q: "Which command starts a Vite development server?", options: ["npm run dev", "npm start mongo", "vite db", "node vite"], answer: 0 },
      { q: "Which HTTP method normally creates a resource?", options: ["GET", "POST", "DELETE", "HEAD"], answer: 1 },
      { q: "What does CORS control?", options: ["Which origins may call an API from a browser", "CSS rules", "Database indexes", "Image compression"], answer: 0 },
      { q: "Which status code means Not Found?", options: ["200", "301", "404", "500"], answer: 2 },
    ],
    cards: [
      { front: "What is REST?", back: "An API style that uses HTTP methods on resource URLs." },
      { front: "What is CORS?", back: "A browser rule that decides which origins may call an API." },
      { front: "What is JWT?", back: "A signed token the server issues so clients can prove who they are." },
    ],
  },
};

export const TOPICS = Object.keys(BANK);

// Word patterns used to guess which topic a sentence is about.
const PATTERNS = {
  DBMS: /\b(dbms|database|sql|normali[sz]|primary key|foreign key|table)/i,
  React: /\b(react|hooks?|jsx|component|usestate|useeffect)/i,
  Java: /\b(java|jvm|oop|polymorphism|inheritance)\b/i,
  ML: /\b(machine learning|ml|overfitting|regression|neural|supervised|clustering)\b/i,
  Web: /\b(web|http|vite|cors|express|node|html|css|javascript|api)/i,
};

export function detectTopic(text) {
  return TOPICS.find((topic) => PATTERNS[topic].test(text)) || null;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Quiz on one topic, or a mix of all topics when the topic is unknown / "Mixed".
export function generateQuiz(topic, count = 5) {
  const pool = BANK[topic] ? BANK[topic].questions : TOPICS.flatMap((t) => BANK[t].questions);
  return shuffle(pool).slice(0, count);
}

export function generateFlashcards(topic) {
  return BANK[topic] ? BANK[topic].cards : [];
}

/* ------------------------------------------------------------------ */
/* AI Tutor                                                            */
/* ------------------------------------------------------------------ */

export function tutorAnswer(text) {
  const topic = detectTopic(text);

  if (/quiz|mcq/i.test(text)) {
    const count = Math.min(5, Number(text.match(/\d+/)?.[0]) || 3);
    const lines = generateQuiz(topic, count).map((item, i) => {
      const options = item.options.map((o, n) => `${String.fromCharCode(65 + n)}) ${o}`).join("   ");
      return `${i + 1}. ${item.q}\n${options}\nAnswer: ${String.fromCharCode(65 + item.answer)}`;
    });
    return `Practice questions${topic ? ` on ${topic}` : ""}:\n\n${lines.join("\n\n")}`;
  }

  if (/flashcard/i.test(text)) {
    const cards = generateFlashcards(topic || "DBMS");
    return `Flashcards on ${topic || "DBMS"}:\n\n${cards.map((c, i) => `${i + 1}. ${c.front}\n   ${c.back}`).join("\n\n")}`;
  }

  if (topic) {
    return `${BANK[topic].explain}\n\nTip: ask me for a quiz or flashcards on ${topic} to practise this.`;
  }

  return `Here is a study-oriented starting point for “${text}”: break the topic into a definition, core concepts, one worked example, common mistakes and a short practice question. Connect an AI API later for fully generated explanations.`;
}

/* ------------------------------------------------------------------ */
/* Performance analysis and study plan                                 */
/* ------------------------------------------------------------------ */

// `history` is newest-first: [{ topic, score, total }]. `courses` are the student's enrolled courses.
export function analyzePerformance(history, courses = []) {
  const insights = [];
  const pct = (h) => (h.total ? (h.score / h.total) * 100 : 0);
  const avg = (list) => Math.round(list.reduce((n, h) => n + pct(h), 0) / list.length);

  if (!history.length) {
    insights.push("Take your first quiz to unlock personalised insights.");
  } else {
    const overall = avg(history);
    insights.push(
      overall >= 80
        ? `Strong results: your quiz average is ${overall}%. Try harder topics to keep improving.`
        : overall >= 50
          ? `Your quiz average is ${overall}%. Regular revision with flashcards should push it higher.`
          : `Your quiz average is ${overall}%. Revisit the basics with the AI Tutor before the next quiz.`
    );

    const byTopic = {};
    history.forEach((h) => (byTopic[h.topic || "Mixed"] ||= []).push(h));
    const ranked = Object.entries(byTopic).map(([topic, list]) => ({ topic, score: avg(list) })).sort((a, b) => a.score - b.score);
    if (ranked.length > 1) {
      insights.push(`Weakest topic: ${ranked[0].topic} (${ranked[0].score}%). Strongest: ${ranked.at(-1).topic} (${ranked.at(-1).score}%).`);
    }

    if (history.length >= 4) {
      const recent = avg(history.slice(0, 2));
      const before = avg(history.slice(2, 4));
      insights.push(recent > before ? "Your latest scores are improving. Keep the momentum going." : recent < before ? "Your latest scores dropped a little. A short revision session may help." : "Your scores are steady over the last few quizzes.");
    }
  }

  const slowest = [...courses].sort((a, b) => a.progress - b.progress)[0];
  if (slowest && slowest.progress < 100) {
    insights.push(`Focus next on “${slowest.title}” — it is your least completed course (${slowest.progress}%).`);
  }
  return insights;
}

// Builds a day plan that starts with the least completed courses.
// Generates a study plan using the Groq API.
export async function generatePlan(courses) {
  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error("Enroll in at least one course to generate an AI plan.");
  }

  const data = await apiRequest("/api/ai/plan", {
    method: "POST",
    body: JSON.stringify({
      courses: courses.map((course) => ({
        title: course.title,
        progress: course.progress,
      })),
    }),
  });

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("Groq returned an empty study plan.");
  }

  return data.items;
}