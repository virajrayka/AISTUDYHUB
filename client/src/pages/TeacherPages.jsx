import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, Layout, PageIntro } from "../components/Layout";
import {
  CATEGORIES, KEYS, average, defaultSystem, getUser, newId, percent,
  seedCatalog, seedEnrollments, seedLibrary, seedQuizzes, today, useAllAttempts, useStoredState, useUsers,
} from "../data/store";
import { generateQuiz } from "../data/aiEngine";

/* ------------------------------------------------------------------ */
/* Shared teacher data                                                 */
/* ------------------------------------------------------------------ */

function useTeacherData() {
  const user = getUser();
  const [catalog, setCatalog] = useStoredState(KEYS.catalog, seedCatalog);
  const [enrollments] = useStoredState(KEYS.enrollments, seedEnrollments);
  const [library, setLibrary] = useStoredState(KEYS.library, seedLibrary);
  const [quizzes, setQuizzes] = useStoredState(KEYS.quizzes, seedQuizzes);
  const [users] = useUsers();

  const myCourses = catalog.filter((c) => c.teacherEmail === user.email);
  const myIds = myCourses.map((c) => c.id);
  const myEnrollments = enrollments.filter((e) => myIds.includes(e.courseId));
  const myMaterials = library.filter((m) => m.scope === "course" && m.uploaderEmail === user.email);
  const myQuizzes = quizzes.filter((q) => q.teacherEmail === user.email);

  return { user, catalog, setCatalog, library, setLibrary, quizzes, setQuizzes, myCourses, myEnrollments, myMaterials, myQuizzes, users };
}

const statusColor = { approved: "green", pending: "amber", rejected: "red" };

function Stat({ icon, label, value, note }) {
  return <div className="app-stat"><span className="app-stat-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></div>;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export function TeacherDashboard() {
  const { user, myCourses, myEnrollments, myMaterials, myQuizzes } = useTeacherData();
  const students = new Set(myEnrollments.map((e) => e.email)).size;
  const pending = myCourses.filter((c) => c.status === "pending").length;

  return (
    <Layout title="Dashboard" subtitle="Your teaching overview">
      <PageIntro eyebrow="TEACHER DASHBOARD" title={`Welcome, ${user.name?.split(" ")[0] || "Teacher"}.`} text="Manage your courses, materials and quizzes in one place." action={<Link className="primary-btn link-btn" to="/teacher/courses">+ New course</Link>} />

      <div className="stats-grid">
        <Stat icon="▣" label="My Courses" value={myCourses.length} note={pending ? `${pending} awaiting approval` : "All reviewed"} />
        <Stat icon="◇" label="Students" value={students} note="Enrolled in your courses" />
        <Stat icon="□" label="Materials" value={myMaterials.length} note="Shared with students" />
        <Stat icon="◆" label="Quizzes" value={myQuizzes.length} note="Created by you" />
      </div>

      <div className="content-grid two">
        <section className="app-card">
          <div className="card-head"><div><span>COURSES</span><h2>Your courses</h2></div><Link to="/teacher/courses">Manage →</Link></div>
          {myCourses.length ? myCourses.map((c) => (
            <div className="history-row" key={c.id}>
              <span>▣</span>
              <div><strong>{c.title}</strong><small>{myEnrollments.filter((e) => e.courseId === c.id).length} students</small></div>
              <span className={`badge ${statusColor[c.status]}`}>{c.status}</span>
            </div>
          )) : <EmptyState icon="▣" title="No courses yet" text="Create your first course to start teaching." />}
        </section>
        <section className="app-card">
          <div className="card-head"><div><span>QUICK ACTIONS</span><h2>Get started</h2></div></div>
          <div className="stack">
            <Link className="small-btn" to="/teacher/materials">□ Upload study material</Link>
            <Link className="small-btn" to="/teacher/quizzes">◆ Create a quiz</Link>
            <Link className="small-btn" to="/teacher/students">◇ View student progress</Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Courses: create and manage                                          */
/* ------------------------------------------------------------------ */

export function TeacherCourses() {
  const { user, catalog, setCatalog, myCourses, myEnrollments } = useTeacherData();
  const [system] = useStoredState(KEYS.system, defaultSystem);
  const [form, setForm] = useState({ title: "", subtitle: "", category: "DBMS", description: "" });
  const [error, setError] = useState("");
  const update = (key, value) => setForm({ ...form, [key]: value });

  const create = () => {
    if (!form.title.trim()) return setError("Please enter a course title.");
    setError("");
    // Admin can require approval before students see a new course.
    const status = system.requireApproval ? "pending" : "approved";
    setCatalog([...catalog, { id: newId(), ...form, title: form.title.trim(), subtitle: form.subtitle.trim() || "New course", description: form.description.trim(), teacherEmail: user.email, teacherName: user.name, status }]);
    setForm({ title: "", subtitle: "", category: "DBMS", description: "" });
  };

  return (
    <Layout title="My Courses" subtitle="Create and manage courses">
      <PageIntro eyebrow="TEACHING" title="My courses" text={system.requireApproval ? "New courses are reviewed by an administrator before students can see them." : "New courses are published immediately."} />
      <div className="content-grid two">
        <section className="app-card">
          <div className="card-head"><div><span>YOUR COURSES</span><h2>{myCourses.length} courses</h2></div></div>
          {myCourses.length ? myCourses.map((c) => (
            <div className="material-row" key={c.id}>
              <span className="file-icon">{c.category.slice(0, 3)}</span>
              <div><strong>{c.title}</strong><small>{c.subtitle} · {myEnrollments.filter((e) => e.courseId === c.id).length} students</small></div>
              <span className="row-actions">
                <span className={`badge ${statusColor[c.status]}`}>{c.status}</span>
                <button className="danger-btn" onClick={() => window.confirm(`Delete “${c.title}”?`) && setCatalog(catalog.filter((x) => x.id !== c.id))}>Delete</button>
              </span>
            </div>
          )) : <EmptyState icon="▣" title="No courses yet" text="Use the form to create your first course." />}
        </section>

        <section className="app-card">
          <div className="card-head"><div><span>NEW COURSE</span><h2>Create a course</h2></div></div>
          <div className="form-stack">
            {error && <div className="error-message">{error}</div>}
            <input className="full-input" placeholder="Course title" value={form.title} onChange={(e) => update("title", e.target.value)} />
            <input className="full-input" placeholder="Short subtitle (optional)" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
            <select className="select-input" value={form.category} onChange={(e) => update("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <textarea className="textarea-input" placeholder="What will students learn?" value={form.description} onChange={(e) => update("description", e.target.value)} />
            <button className="primary-btn" onClick={create}>Create course</button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Materials: upload content for a course                              */
/* ------------------------------------------------------------------ */

export function TeacherMaterials() {
  const { user, library, setLibrary, myCourses, myMaterials } = useTeacherData();
  const [courseId, setCourseId] = useState("");
  const target = Number(courseId) || myCourses[0]?.id;

  const upload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !target) return;
    // Only the file details are saved for now. Real file storage comes with the backend.
    setLibrary([{ id: newId(), name: file.name, type: file.name.split(".").pop().toUpperCase(), size: `${Math.max(1, Math.round(file.size / 1024))} KB`, scope: "course", courseId: target, uploaderEmail: user.email, uploaderName: user.name, date: today() }, ...library]);
    e.target.value = "";
  };

  const courseName = (id) => myCourses.find((c) => c.id === id)?.title || "Course";

  return (
    <Layout title="Materials" subtitle="Share content with students">
      <PageIntro eyebrow="TEACHING" title="Course materials" text="Upload notes and documents for the students enrolled in a course." />
      {myCourses.length === 0 ? (
        <div className="app-card"><EmptyState icon="□" title="Create a course first" text="Materials are attached to one of your courses." /></div>
      ) : (
        <>
          <div className="toolbar">
            <select className="select-input inline-select" value={target} onChange={(e) => setCourseId(e.target.value)}>{myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            <label className="primary-btn upload-label">+ Upload to this course<input type="file" hidden onChange={upload} /></label>
          </div>
          <div className="app-card material-list">
            {myMaterials.length ? myMaterials.map((m) => (
              <div className="material-row" key={m.id}>
                <span className="file-icon">{m.type.slice(0, 3)}</span>
                <div><strong>{m.name}</strong><small>{m.type} · {m.size} · {courseName(m.courseId)} · {m.date}</small></div>
                <button className="danger-btn" onClick={() => setLibrary(library.filter((x) => x.id !== m.id))}>Delete</button>
              </div>
            )) : <EmptyState icon="□" title="No materials yet" text="Upload a file to share it with your students." />}
          </div>
        </>
      )}
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Quizzes: build questions by hand or with AI                         */
/* ------------------------------------------------------------------ */

const emptyQuestion = { q: "", options: ["", "", "", ""], answer: 0 };

export function TeacherQuizzes() {
  const { user, quizzes, setQuizzes, myCourses, myQuizzes } = useTeacherData();
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [draft, setDraft] = useState([]); // questions added so far
  const [question, setQuestion] = useState(emptyQuestion);
  const [error, setError] = useState("");

  const target = Number(courseId) || myCourses[0]?.id;
  const course = myCourses.find((c) => c.id === target);
  const attempts = useAllAttempts();

  const setOption = (i, value) => setQuestion({ ...question, options: question.options.map((o, n) => (n === i ? value : o)) });

  const addQuestion = () => {
    if (!question.q.trim() || question.options.some((o) => !o.trim())) return setError("Enter the question and all four options.");
    setError("");
    setDraft([...draft, { ...question, q: question.q.trim(), options: question.options.map((o) => o.trim()) }]);
    setQuestion(emptyQuestion);
  };

  // AI helper: adds 3 questions on the selected course's topic.
  const aiFill = () => setDraft([...draft, ...generateQuiz(course?.category, 3)]);

  const save = () => {
    if (!title.trim() || !target || draft.length === 0) return setError("Add a title, choose a course and add at least one question.");
    setError("");
    setQuizzes([...quizzes, { id: newId(), title: title.trim(), courseId: target, teacherEmail: user.email, questions: draft }]);
    setTitle(""); setDraft([]);
  };

  return (
    <Layout title="Quizzes" subtitle="Create assessments">
      <PageIntro eyebrow="TEACHING" title="Quizzes" text="Build a quiz for your students. Let the AI suggest questions to save time." />
      {myCourses.length === 0 ? (
        <div className="app-card"><EmptyState icon="◆" title="Create a course first" text="Quizzes are attached to one of your courses." /></div>
      ) : (
        <div className="content-grid two">
          <section className="app-card">
            <div className="card-head"><div><span>NEW QUIZ</span><h2>Quiz builder</h2></div><b className="count-pill">{draft.length} questions</b></div>
            <div className="form-stack">
              {error && <div className="error-message">{error}</div>}
              <input className="full-input" placeholder="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <select className="select-input" value={target} onChange={(e) => setCourseId(e.target.value)}>{myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>

              <input className="full-input" placeholder="Question" value={question.q} onChange={(e) => setQuestion({ ...question, q: e.target.value })} />
              {question.options.map((o, i) => (
                <div className="option-input-row" key={i}>
                  <input type="radio" name="correct" checked={question.answer === i} onChange={() => setQuestion({ ...question, answer: i })} title="Correct answer" />
                  <input className="full-input" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={o} onChange={(e) => setOption(i, e.target.value)} />
                </div>
              ))}
              <div className="row-actions"><button className="small-btn" onClick={addQuestion}>+ Add question</button><button className="small-btn" onClick={aiFill}>✦ Suggest 3 with AI</button></div>

              {draft.map((d, i) => (
                <div className="question-draft" key={i}>
                  <strong>{i + 1}. {d.q}</strong>
                  <small>Answer: {d.options[d.answer]}</small>
                  <button className="danger-btn" onClick={() => setDraft(draft.filter((_, n) => n !== i))}>Remove</button>
                </div>
              ))}
              <button className="primary-btn" onClick={save}>Save quiz</button>
            </div>
          </section>

          <section className="app-card">
            <div className="card-head"><div><span>YOUR QUIZZES</span><h2>{myQuizzes.length} quizzes</h2></div></div>
            {myQuizzes.length ? myQuizzes.map((q) => {
              const results = attempts.filter((a) => a.quizId === q.id);
              return (
                <div className="material-row" key={q.id}>
                  <span className="file-icon">QZ</span>
                  <div><strong>{q.title}</strong><small>{q.questions.length} questions · {results.length} attempts{results.length ? ` · avg ${average(results.map((r) => percent(r.score, r.total)))}%` : ""}</small></div>
                  <button className="danger-btn" onClick={() => setQuizzes(quizzes.filter((x) => x.id !== q.id))}>Delete</button>
                </div>
              );
            }) : <EmptyState icon="◆" title="No quizzes yet" text="Build your first quiz on the left." />}
          </section>
        </div>
      )}
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Students enrolled in my courses                                     */
/* ------------------------------------------------------------------ */

export function TeacherStudents() {
  const { catalog, users, myCourses, myEnrollments, myQuizzes } = useTeacherData();
  const attempts = useAllAttempts();
  const myQuizIds = myQuizzes.map((q) => q.id);
  const emails = [...new Set(myEnrollments.map((e) => e.email))];

  return (
    <Layout title="Students" subtitle="Progress in your courses">
      <PageIntro eyebrow="TEACHING" title="Students" text="See who is enrolled in your courses and how they are doing." />
      <div className="app-card">
        {emails.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>STUDENT</th><th>COURSES</th><th>AVG PROGRESS</th><th>MY QUIZZES</th></tr></thead>
              <tbody>
                {emails.map((email) => {
                  const rows = myEnrollments.filter((e) => e.email === email);
                  const results = attempts.filter((a) => a.email === email && myQuizIds.includes(a.quizId));
                  return (
                    <tr key={email}>
                      <td><strong>{users.find((u) => u.email === email)?.name || email}</strong><small>{email}</small></td>
                      <td>{rows.map((r) => catalog.find((c) => c.id === r.courseId)?.title).join(", ")}</td>
                      <td>{average(rows.map((r) => r.progress))}%</td>
                      <td>{results.length ? `${average(results.map((r) => percent(r.score, r.total)))}% (${results.length})` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon="◇" title="No students yet" text={myCourses.length ? "Students appear here after they enroll in one of your courses." : "Create a course first."} />}
      </div>
    </Layout>
  );
}
