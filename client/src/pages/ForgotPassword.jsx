
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Auth.css";
import { apiRequest } from "../data/store";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  async function handleRequestCode(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      setCodeSent(true);
      setMessage(
        data.message ||
          "If an active account exists, a reset code has been sent."
      );
    } catch (err) {
      setError(err.message || "Unable to send the reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit reset code.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password.length > 128) {
      setError("Your password must be 128 characters or fewer.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          code: code.trim(),
          password,
        }),
      });

      setMessage(data.message || "Password reset successful.");

      // Clear sensitive form values before navigating.
      setCode("");
      setPassword("");
      setConfirmPassword("");

      navigate("/login", {
        replace: true,
        state: { passwordReset: true },
      });
    } catch (err) {
      setError(err.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <Link to="/" className="auth-brand-link">
            <div className="logo">AI StudyHub</div>
          </Link>

          <div className="brand-content">
            <h1>
              Secure your account.
              <br />
              Start fresh.
            </h1>
            <p>
              Reset your password securely using the verification code sent
              to your registered email address.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature">
              <span className="feature-icon">✦</span>
              Secure email verification
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              One-time reset code
            </div>
            <div className="feature">
              <span className="feature-icon">↗</span>
              Get back to learning
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <form
            className="auth-form"
            onSubmit={codeSent ? handleResetPassword : handleRequestCode}
          >
            <Link to="/login" className="back-home">
              <span>←</span>
              Back to Login
            </Link>

            <h2>{codeSent ? "Create a new password" : "Forgot password?"}</h2>

            <p className="auth-subtitle">
              {codeSent
                ? "Enter your email code and choose a new password."
                : "Enter your registered email to receive a reset code."}
            </p>

            {error && <div className="error-message">{error}</div>}

            {message && (
              <div className="success-message" role="status">
                {message}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={codeSent || loading}
              />
            </div>

            {codeSent && (
              <>
                <div className="form-group">
                  <label htmlFor="reset-code">6-digit reset code</label>
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter code from email"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    maxLength={128}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter your new password again"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    maxLength={128}
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : codeSent
                  ? "Reset Password"
                  : "Send Reset Code"}
            </button>

            <p className="auth-footer">
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
