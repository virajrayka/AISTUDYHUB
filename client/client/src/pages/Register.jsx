import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Auth.css";
import { apiRequest, defaultSystem, homeFor, setAuthSession, KEYS, useStoredState } from "../data/store";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "student" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const [system] = useStoredState(KEYS.system, defaultSystem);
  const registrationOpen = system.allowRegistration;
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirmPassword) return setError("Please fill in all fields.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (!registrationOpen) return setError("New registrations are currently closed by the administrator.");

    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password: form.password, role: form.role }),
      });

      setAuthSession(data.user, data.token);
      navigate(homeFor(data.user.role), { replace: true });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="logo">AI StudyHub</div>
          <div className="brand-content">
            <h1>Start your<br />learning journey.</h1>
            <p>Build better study habits, understand difficult topics, and track your progress with an intelligent learning platform.</p>
          </div>
          <div className="feature-list">
            <div className="feature"><span className="feature-icon">✦</span>AI-powered explanations</div>
            <div className="feature"><span className="feature-icon">◆</span>Smart quizzes & flashcards</div>
            <div className="feature"><span className="feature-icon">◷</span>Personalized study planning</div>
          </div>
        </div>

        <div className="auth-form-section">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2>Create account</h2>
            <p className="auth-subtitle">Join AI StudyHub and start learning smarter.</p>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>I am a</label>
              <div className="role-picker">
                {[["student", "Student", "Learn and practise"], ["teacher", "Teacher", "Create courses and quizzes"]].map(([value, label, note]) => (
                  <button type="button" key={value} className={form.role === value ? "role-option selected" : "role-option"} onClick={() => update("role", value)}>
                    <strong>{label}</strong><small>{note}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group"><label htmlFor="name">Full name</label><input id="name" type="text" placeholder="Enter your full name" value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
            <div className="form-group"><label htmlFor="register-email">Email address</label><input id="register-email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>

            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <div className="password-wrapper">
                <input id="register-password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={form.password} onChange={(e) => update("password", e.target.value)} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm password</label>
              <div className="password-wrapper">
                <input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? "Hide" : "Show"}</button>
              </div>
            </div>

            <button type="submit" className="auth-button">Create Account</button>
            <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
            <p className="demo-note">Your account is stored securely in MongoDB Atlas.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
