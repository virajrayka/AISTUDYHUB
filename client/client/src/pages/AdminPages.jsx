import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, Layout, PageIntro, Toggle } from "../components/Layout";
import {
  API_URL, KEYS, defaultSystem, getUser, resetAllData, seedCatalog,
  seedEnrollments, seedLibrary, seedQuizzes, useAllAttempts, useStoredState, useUsers,
} from "../data/store";

const statusColor = { approved: "green", pending: "amber", rejected: "red", active: "green", suspended: "red" };

function Stat({ icon, label, value, note }) {
  return <div className="app-stat"><span className="app-stat-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></div>;
}

// Users are read once, then every change is saved back to storage.
/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

export function AdminDashboard() {
  const [users] = useUsers();
  const attempts = useAllAttempts();
  const [catalog, setCatalog] = useStoredState(KEYS.catalog, seedCatalog);
  const [enrollments] = useStoredState(KEYS.enrollments, seedEnrollments);
  const [library] = useStoredState(KEYS.library, seedLibrary);
  const [quizzes] = useStoredState(KEYS.quizzes, seedQuizzes);

  const count = (role) => users.filter((u) => u.role === role).length;
  const pending = catalog.filter((c) => c.status === "pending");
  const setStatus = (id, status) => setCatalog(catalog.map((c) => (c.id === id ? { ...c, status } : c)));

  return (
    <Layout title="Overview" subtitle="Platform overview">
      <PageIntro eyebrow="ADMIN DASHBOARD" title="Platform overview" text="Monitor users, courses and activity across AI StudyHub." />
      <div className="stats-grid">
        <Stat icon="◇" label="Users" value={users.length} note={`${count("student")} students · ${count("teacher")} teachers`} />
        <Stat icon="▣" label="Courses" value={catalog.filter((c) => c.status === "approved").length} note={`${pending.length} awaiting approval`} />
        <Stat icon="□" label="Materials" value={library.length} note={`${quizzes.length} quizzes`} />
        <Stat icon="◆" label="Quiz attempts" value={attempts.length} note={`${enrollments.length} enrollments`} />
      </div>

      <div className="content-grid two">
        <section className="app-card">
          <div className="card-head"><div><span>REVIEW</span><h2>Courses awaiting approval</h2></div><Link to="/admin/courses">All courses →</Link></div>
          {pending.length ? pending.map((c) => (
            <div className="material-row" key={c.id}>
              <span className="file-icon">{c.category.slice(0, 3)}</span>
              <div><strong>{c.title}</strong><small>by {c.teacherName}</small></div>
              <span className="row-actions"><button className="small-btn primary" onClick={() => setStatus(c.id, "approved")}>Approve</button><button className="danger-btn" onClick={() => setStatus(c.id, "rejected")}>Reject</button></span>
            </div>
          )) : <EmptyState icon="✓" title="Nothing to review" text="New teacher courses will appear here." />}
        </section>
        <section className="app-card">
          <div className="card-head"><div><span>NEWEST</span><h2>Recent users</h2></div><Link to="/admin/users">Manage →</Link></div>
          {[...users].reverse().slice(0, 5).map((u) => (
            <div className="history-row" key={u.id}><span>◇</span><div><strong>{u.name}</strong><small>{u.email}</small></div><span className="badge">{u.role}</span></div>
          ))}
        </section>
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export function AdminUsers() {
  const me = getUser();
  const [users, setUsers] = useUsers();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");

  const visible = users.filter((u) => (role === "all" || u.role === role) && `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()));
  const change = (id, patch) => setUsers(users.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  const remove = (u) => window.confirm(`Delete ${u.name}?`) && setUsers(users.filter((x) => x.id !== u.id));

  return (
    <Layout title="Users" subtitle="Manage accounts">
      <PageIntro eyebrow="ADMINISTRATION" title="Users" text="Change roles, suspend accounts or remove users." />
      <div className="filter-row">{["all", "student", "teacher", "admin"].map((r) => <button key={r} className={role === r ? "selected" : ""} onClick={() => setRole(r)}>{r === "all" ? "All" : `${r.charAt(0).toUpperCase()}${r.slice(1)}s`}</button>)}</div>
      <div className="toolbar"><input placeholder="Search by name or email..." value={query} onChange={(e) => setQuery(e.target.value)} /><span>{visible.length} users</span></div>
      <div className="app-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>USER</th><th>ROLE</th><th>STATUS</th><th>JOINED</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {visible.map((u) => {
                const isMe = u.email === me.email; // admins cannot lock themselves out
                return (
                  <tr key={u.id}>
                    <td><strong>{u.name}{isMe && " (you)"}</strong><small>{u.email}</small></td>
                    <td><select className="select-input table-select" value={u.role} disabled={isMe} onChange={(e) => change(u.id, { role: e.target.value })}><option>student</option><option>teacher</option><option>admin</option></select></td>
                    <td><span className={`badge ${statusColor[u.status]}`}>{u.status}</span></td>
                    <td>{u.joined}</td>
                    <td className="row-actions">
                      <button className="small-btn" disabled={isMe} onClick={() => change(u.id, { status: u.status === "active" ? "suspended" : "active" })}>{u.status === "active" ? "Suspend" : "Activate"}</button>
                      <button className="danger-btn" disabled={isMe} onClick={() => remove(u)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <EmptyState icon="◇" title="No users found" text="Try another search or filter." />}
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Courses                                                             */
/* ------------------------------------------------------------------ */

export function AdminCourses() {
  const [catalog, setCatalog] = useStoredState(KEYS.catalog, seedCatalog);
  const [enrollments] = useStoredState(KEYS.enrollments, seedEnrollments);
  const [status, setStatusFilter] = useState("all");

  const visible = catalog.filter((c) => status === "all" || c.status === status);
  const setStatus = (id, next) => setCatalog(catalog.map((c) => (c.id === id ? { ...c, status: next } : c)));

  return (
    <Layout title="Courses" subtitle="Review and manage courses">
      <PageIntro eyebrow="ADMINISTRATION" title="Courses" text="Approve new courses, unpublish them or remove them from the platform." />
      <div className="filter-row">{["all", "pending", "approved", "rejected"].map((s) => <button key={s} className={status === s ? "selected" : ""} onClick={() => setStatusFilter(s)}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>)}</div>
      <div className="app-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>COURSE</th><th>TEACHER</th><th>STUDENTS</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong><small>{c.category} · {c.subtitle}</small></td>
                  <td>{c.teacherName}</td>
                  <td>{enrollments.filter((e) => e.courseId === c.id).length}</td>
                  <td><span className={`badge ${statusColor[c.status]}`}>{c.status}</span></td>
                  <td className="row-actions">
                    {c.status !== "approved" && <button className="small-btn primary" onClick={() => setStatus(c.id, "approved")}>Approve</button>}
                    {c.status !== "rejected" && <button className="small-btn" onClick={() => setStatus(c.id, "rejected")}>{c.status === "approved" ? "Unpublish" : "Reject"}</button>}
                    <button className="danger-btn" onClick={() => window.confirm(`Delete “${c.title}”?`) && setCatalog(catalog.filter((x) => x.id !== c.id))}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <EmptyState icon="▣" title="No courses found" text="No courses match this filter." />}
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* System                                                              */
/* ------------------------------------------------------------------ */

export function AdminSystem() {
  const [system, setSystem] = useStoredState(KEYS.system, defaultSystem);
  const [server, setServer] = useState("checking"); // checking | online | offline
  const [health, setHealth] = useState(null);

  // Reads the real state of the Express API and MongoDB connection.
  const checkServer = async () => {
    setServer("checking");
    try {
      const res = await fetch(`${API_URL}/api/health/db`);
      if (!res.ok) throw new Error("bad status");
      setHealth(await res.json());
      setServer("online");
    } catch {
      setHealth(null);
      setServer("offline");
    }
  };

  useEffect(() => { checkServer(); }, []);

  const reset = async () => {
    if (!window.confirm("Delete ALL study data (courses, materials, quizzes and student data) and sign out?")) return;
    await resetAllData();
    window.location.href = "/login";
  };

  const serverLabel = { checking: "Checking...", online: "Online", offline: "Not reachable" }[server];
  const dbOk = Boolean(health?.connected);

  return (
    <Layout title="System" subtitle="Platform settings">
      <PageIntro eyebrow="ADMINISTRATION" title="System" text="Control platform rules and check the status of the backend." />
      <div className="settings-grid">
        <section className="app-card">
          <div className="card-head"><div><span>RULES</span><h2>Platform settings</h2></div></div>
          <Toggle label="Allow new registrations" checked={system.allowRegistration} onChange={() => setSystem({ ...system, allowRegistration: !system.allowRegistration })} />
          <Toggle label="Require approval for new courses" checked={system.requireApproval} onChange={() => setSystem({ ...system, requireApproval: !system.requireApproval })} />
          <div className="danger-zone"><strong>Demo data</strong><p>Deletes application study data from MongoDB Atlas. User accounts are kept.</p><button className="danger-btn" onClick={reset}>Reset all demo data</button></div>
        </section>

        <section className="app-card">
          <div className="card-head"><div><span>STATUS</span><h2>Backend</h2></div></div>
          <div className="history-row"><span>□</span><div><strong>Data storage</strong><small>MongoDB Atlas</small></div></div>
          <div className="history-row"><span>◆</span><div><strong>Database</strong><small>{health?.database ? `MongoDB · ${health.database}` : "MongoDB Atlas"}</small></div><span className={`badge ${dbOk ? "green" : "red"}`}>{dbOk ? "connected" : "unknown"}</span></div>
          <div className="history-row"><span>✦</span><div><strong>AI Tutor</strong><small>{health?.ai ? "Claude API key configured" : "No API key: local fallback tutor"}</small></div><span className={`badge ${health?.ai ? "green" : "amber"}`}>{health?.ai ? "live" : "fallback"}</span></div>
          <div className="history-row"><span>↗</span><div><strong>Express API</strong><small>{API_URL}</small></div><span className={`badge ${server === "online" ? "green" : server === "offline" ? "red" : ""}`}>{serverLabel}</span></div>
          <button className="small-btn" onClick={checkServer}>Re-check server</button>
        </section>
      </div>
    </Layout>
  );
}
