import { useCallback, useEffect, useRef, useState } from "react";

/* MongoDB-backed application data layer. localStorage is used only for the JWT/session
   and as a temporary UI fallback while the API request is loading. */
export const KEYS = {
  users: "studyhubUsers",
  session: "studyhubUser",
  loggedIn: "isLoggedIn",
  catalog: "studyhubCatalog",
  enrollments: "studyhubEnrollments",
  library: "studyhubLibrary",
  quizzes: "studyhubQuizzes",
  system: "studyhubSystem",
};

export const USER_KEYS = [
  "studyhubTasks",
  "studyhubChat",
  "studyhubQuizHistory",
  "studyhubFlashcards",
  "studyhubPlanner",
  "studyhubSettings",
];

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
export const TOKEN_KEY = "studyhubToken";

const RESOURCE_BY_KEY = {
  [KEYS.catalog]: "catalog",
  [KEYS.enrollments]: "enrollments",
  [KEYS.library]: "library",
  [KEYS.quizzes]: "quizzes",
  [KEYS.system]: "system",
  studyhubTasks: "tasks",
  studyhubChat: "chat",
  studyhubQuizHistory: "quizHistory",
  studyhubFlashcards: "flashcards",
  studyhubPlanner: "planner",
  studyhubSettings: "settings",
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(user, token) {
  write(KEYS.session, user);
  localStorage.setItem(KEYS.loggedIn, "true");
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthSession() {
  localStorage.removeItem(KEYS.session);
  localStorage.removeItem(KEYS.loggedIn);
  localStorage.removeItem(TOKEN_KEY);
}


export async function apiRequest(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers || {});

  // JSON requests need a Content-Type header.
  // FormData requests must let the browser set it automatically.
  if (options.body && !isFormData) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (isFormData) {
    headers.delete("Content-Type");
  }

  // Attach authentication token.
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  // Handle expired authentication.
  if (
    response.status === 401 &&
    token &&
    !path.startsWith("/api/auth/")
  ) {
    clearAuthSession();
    window.location.assign("/login");
    return;
  }

  // Handle API errors.
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const CATEGORIES = ["DBMS", "React", "Java", "ML", "Web", "Other"];
export const TOPICS_LIST = CATEGORIES.filter((c) => c !== "Other");
export const defaultSystem = { allowRegistration: true, requireApproval: true };
const COLORS = { DBMS: "purple", React: "blue", Java: "orange", ML: "green", Web: "blue" };
export const colorFor = (category) => COLORS[category] || "purple";

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const newId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);
export const today = () => new Date().toLocaleDateString("en-IN");

function resourceForKey(key) {
  if (RESOURCE_BY_KEY[key]) return RESOURCE_BY_KEY[key];
  const match = key.match(/^(studyhubTasks|studyhubChat|studyhubQuizHistory|studyhubFlashcards|studyhubPlanner|studyhubSettings):/);
  return match ? RESOURCE_BY_KEY[match[1]] : null;
}

async function fetchStoredResource(key) {
  if (key === KEYS.users) {
    const data = await apiRequest("/api/users");
    return data.users || [];
  }
  const resource = resourceForKey(key);
  if (!resource) return null;
  const data = await apiRequest(`/api/data/${resource}`);
  return data.data;
}

async function persistStoredResource(key, value) {
  if (key === KEYS.users) {
    await apiRequest("/api/users", { method: "PUT", body: JSON.stringify({ users: value }) });
    return;
  }
  const resource = resourceForKey(key);
  if (!resource) return;
  await apiRequest(`/api/data/${resource}`, { method: "PUT", body: JSON.stringify({ data: value }) });
}

export function useStoredState(key, fallback) {
  const initial = typeof fallback === "function" ? fallback() : fallback;
  const [value, setValue] = useState(() => read(key, initial));
  const latest = useRef(value);

  useEffect(() => {
    let active = true;
    fetchStoredResource(key)
      .then((remote) => {
        if (!active || remote === null || typeof remote === "undefined") return;
        latest.current = remote;
        setValue(remote);
        write(key, remote);
      })
      .catch(() => {
        // Keep the local copy if the API is temporarily unavailable.
      });
    return () => { active = false; };
  }, [key]);

  // Side effects (localStorage + API save) run once per change, outside the state updater.
  const setAndPersist = useCallback((next) => {
    const resolved = typeof next === "function" ? next(latest.current) : next;
    latest.current = resolved;
    setValue(resolved);
    write(key, resolved);
    if (getToken()) {
      persistStoredResource(key, resolved).catch((error) => {
        console.error(`Failed to save ${key}:`, error.message);
        window.dispatchEvent(new CustomEvent("studyhub:error", { detail: `Your last change could not be saved: ${error.message}` }));
      });
    }
  }, [key]);

  return [value, setAndPersist];
}

export function useUserState(name, fallback) {
  const email = getUser().email;
  return useStoredState(`${name}:${email}`, fallback);
}

export function useUsers() {
  return useStoredState(KEYS.users, []);
}

export async function getAllAttemptsRemote() {
  const data = await apiRequest("/api/data/quiz-attempts/all");
  return data.data || [];
}

export function useAllAttempts() {
  const [attempts, setAttempts] = useState([]);
  useEffect(() => {
    let active = true;
    getAllAttemptsRemote().then((data) => active && setAttempts(data)).catch(() => {});
    return () => { active = false; };
  }, []);
  return attempts;
}

/* Demo seeds are retained only as first-paint fallbacks. The server seeds the same
   data into MongoDB on first startup. */
const TEACHER = { teacherEmail: "teacher@studyhub.com", teacherName: "Demo Teacher" };
export const seedCatalog = () => [
  { id: 1, title: "Database Management", subtitle: "Normalization & SQL", category: "DBMS", description: "Relational design, normal forms and SQL queries.", status: "approved", ...TEACHER },
  { id: 2, title: "React Development", subtitle: "Components & Hooks", category: "React", description: "Build interactive interfaces with React.", status: "approved", ...TEACHER },
  { id: 3, title: "Java Programming", subtitle: "OOP Concepts", category: "Java", description: "Classes, inheritance and polymorphism in Java.", status: "approved", ...TEACHER },
  { id: 4, title: "Machine Learning", subtitle: "Feature Engineering", category: "ML", description: "Supervised learning and model evaluation basics.", status: "approved", ...TEACHER },
];
export const seedEnrollments = () => [
  { id: 1, email: "student@studyhub.com", courseId: 1, progress: 68 },
  { id: 2, email: "student@studyhub.com", courseId: 2, progress: 42 },
  { id: 3, email: "student@studyhub.com", courseId: 3, progress: 81 },
  { id: 4, email: "student@studyhub.com", courseId: 4, progress: 35 },
];
export const seedLibrary = () => [
  { id: 1, name: "DBMS Normalization Notes", type: "PDF", size: "1.8 MB", scope: "course", courseId: 1, uploaderEmail: TEACHER.teacherEmail, uploaderName: TEACHER.teacherName, date: today() },
  { id: 2, name: "React Hooks Cheat Sheet", type: "DOC", size: "420 KB", scope: "course", courseId: 2, uploaderEmail: TEACHER.teacherEmail, uploaderName: TEACHER.teacherName, date: today() },
  { id: 3, name: "Java OOP Revision", type: "PDF", size: "2.1 MB", scope: "course", courseId: 3, uploaderEmail: TEACHER.teacherEmail, uploaderName: TEACHER.teacherName, date: today() },
];
export const seedQuizzes = () => [{
  id: 1, title: "DBMS Basics Check", courseId: 1, teacherEmail: TEACHER.teacherEmail,
  questions: [
    { q: "Which normal form removes repeating groups and requires atomic values?", options: ["1NF", "2NF", "3NF", "BCNF"], answer: 0 },
    { q: "What does a primary key guarantee?", options: ["Unique, non-null row identity", "Faster inserts", "Encrypted data", "Duplicate rows"], answer: 0 },
  ],
}];

export function getUsers() { return read(KEYS.users, []); }
export const findUser = (email) => getUsers().find((u) => u.email === email);
export function getUser() { return { name: "Student", email: "", role: "student", ...read(KEYS.session, {}) }; }
export function startSession(user) { setAuthSession(user, getToken()); }
export const endSession = clearAuthSession;
export const isLoggedIn = () => localStorage.getItem(KEYS.loggedIn) === "true";
export const homeFor = (role) => (role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/dashboard");

export const navByRole = {
  student: { label: "LEARNING", items: [["/dashboard", "⌂", "Dashboard"], ["/ai-tutor", "✦", "AI Tutor"], ["/courses", "▣", "Courses"], ["/materials", "□", "Materials"], ["/quiz", "◆", "Quiz"], ["/flashcards", "◇", "Flashcards"], ["/planner", "◷", "Study Planner"], ["/progress", "↗", "Progress"]] },
  teacher: { label: "TEACHING", items: [["/teacher", "⌂", "Dashboard"], ["/teacher/courses", "▣", "My Courses"], ["/teacher/materials", "□", "Materials"], ["/teacher/quizzes", "◆", "Quizzes"], ["/teacher/students", "◇", "Students"]] },
  admin: { label: "ADMINISTRATION", items: [["/admin", "⌂", "Overview"], ["/admin/users", "◇", "Users"], ["/admin/courses", "▣", "Courses"], ["/admin/system", "⚙", "System"]] },
};

export function enrolledCourses(email, catalog, enrollments) {
  return enrollments.filter((e) => e.email === email)
    .map((e) => ({ ...catalog.find((c) => c.id === e.courseId), progress: e.progress }))
    .filter((c) => c?.status === "approved");
}

export const percent = (score, total) => (total ? Math.round((score / total) * 100) : 0);
export const average = (numbers) => (numbers.length ? Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length) : 0);

export async function clearUserData() {
  await apiRequest("/api/data/me", { method: "DELETE" });
  USER_KEYS.forEach((name) => {
    Object.keys(localStorage).filter((key) => key === name || key.startsWith(`${name}:`)).forEach((key) => localStorage.removeItem(key));
  });
}

export async function resetAllData() {
  await apiRequest("/api/data/reset", { method: "POST" });
  Object.keys(localStorage).filter((key) => key.startsWith("studyhub") || key === KEYS.loggedIn).forEach((key) => localStorage.removeItem(key));
}
