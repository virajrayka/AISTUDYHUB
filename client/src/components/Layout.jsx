import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  apiRequest,
  endSession,
  getToken,
  getUser,
  navByRole,
  updateCurrentUser,
} from "../data/store";
import Chatbot from "./Chatbot";

// Shared shell (sidebar + header).
// Sidebar links change according to the user's role.

export function Layout({ children, title, subtitle }) {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState(() => getUser());

  // NEW: load the latest profile (including the photo) from the server
  // once whenever a page mounts. updateCurrentUser() saves it to
  // localStorage and fires "studyhub:user-updated", which the effect
  // below listens for, so the header updates automatically.
  useEffect(() => {
    if (!getToken()) return;

    apiRequest("/api/users/me")
      .then((data) => {
        if (data.user) updateCurrentUser(data.user);
      })
      .catch(() => {
        // Keep the cached user if the server is unavailable.
      });
  }, []);

  // Refresh the header when the user's profile is updated.
  useEffect(() => {
    const refreshUser = (event) => {
      setUser(event.detail || getUser());
    };

    const refreshStorage = () => {
      setUser(getUser());
    };

    window.addEventListener("studyhub:user-updated", refreshUser);
    window.addEventListener("storage", refreshStorage);

    return () => {
      window.removeEventListener("studyhub:user-updated", refreshUser);
      window.removeEventListener("storage", refreshStorage);
    };
  }, []);

  // Listen for application errors.
  useEffect(() => {
    const show = (event) => {
      setNotice(event.detail || "Something went wrong.");
    };

    window.addEventListener("studyhub:error", show);

    return () => {
      window.removeEventListener("studyhub:error", show);
    };
  }, []);

  const menu = navByRole[user.role] || navByRole.student;

  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "S";

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  const logout = () => {
    endSession();
    navigate("/login", { replace: true });
  };

  const nav = (
    <>
      <div className="studyhub-side-logo">
        <Link to={menu.items[0][0]}>
          <span>✦</span> AI StudyHub
        </Link>
      </div>

      <div className="side-label">{menu.label}</div>

      <nav className="side-nav">
        {menu.items.map(([to, icon, label]) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `side-link ${isActive ? "active" : ""}`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="side-bottom">
        <div className="side-label">ACCOUNT</div>

        <NavLink
          to="/settings"
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `side-link ${isActive ? "active" : ""}`
          }
        >
          <span>⚙</span>
          Settings
        </NavLink>

        <button className="side-link side-logout" onClick={logout}>
          <span>↪</span>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <aside className="app-sidebar">{nav}</aside>

      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)}>
          <aside
            className="mobile-sidebar"
            onClick={(event) => event.stopPropagation()}
          >
            {nav}
          </aside>
        </div>
      )}

      <main className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <strong>{title || "AI StudyHub"}</strong>
              {subtitle && <span>{subtitle}</span>}
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-button" title="Notifications">
              ♢<i />
            </button>

            <Link className="user-chip" to="/settings">
              <span style={{ overflow: "hidden" }}>
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name || "Profile"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                      display: "block",
                    }}
                  />
                ) : (
                  initials
                )}
              </span>

              <div>
                <strong>{user.name || "Student"}</strong>
                <small>{roleLabel}</small>
              </div>
            </Link>
          </div>
        </header>

        <div className="app-content">
          {notice && (
            <div className="error-banner" role="alert">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          {children}
        </div>

        <Chatbot />
      </main>
    </div>
  );
}

export function PageIntro({ eyebrow, title, text, action }) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow-label">{eyebrow}</span>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>

      {action}
    </div>
  );
}

export function EmptyState({ icon = "□", title, text }) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <i />
    </label>
  );
}