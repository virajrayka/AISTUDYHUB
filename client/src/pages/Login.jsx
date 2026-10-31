
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../Auth.css";
import { apiRequest, homeFor, setAuthSession } from "../data/store";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      setOtpSent(true);
      setMessage(
        data.message || "If your account is eligible, an OTP has been sent to your email."
      );
    } catch (err) {
      setError(err.message || "Unable to request OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          code: otp.trim(),
        }),
      });

      if (!data.user || !data.token) {
        throw new Error("Login response was incomplete. Please try again.");
      }

      setAuthSession(data.user, data.token);

      navigate(
        location.state?.from || homeFor(data.user.role),
        { replace: true }
      );
    } catch (err) {
      setError(err.message || "OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
    setMessage("");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* LEFT BRAND PANEL */}
        <div className="auth-brand">
          <Link to="/" className="auth-brand-link">
            <div className="logo">AI StudyHub</div>
          </Link>

          <div className="brand-content">
            <h1>
              Learn smarter.
              <br />
              Achieve more.
            </h1>

            <p>
              An intelligent learning platform designed to help students
              understand, practice, and improve with AI-powered learning tools.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature">
              <span className="feature-icon">✦</span>
              AI-powered learning assistance
            </div>

            <div className="feature">
              <span className="feature-icon">✓</span>
              Personalized study experience
            </div>

            <div className="feature">
              <span className="feature-icon">↗</span>
              Track your learning progress
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="auth-form-section">
          <form
            className="auth-form"
            onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}
          >
            <Link to="/" className="back-home">
              <span>←</span>
              Back to Home
            </Link>

            <h2>{otpSent ? "Verify your email" : "Welcome back"}</h2>

            <p className="auth-subtitle">
              {otpSent
                ? "Enter the 6-digit verification code sent to your email."
                : "Sign in securely with a one-time password."}
            </p>

            {error && <div className="error-message">{error}</div>}

            {message && (
              <div className="success-message" role="status">
                {message}
              </div>
            )}

            {/* EMAIL */}
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={otpSent || loading}
              />
            </div>

            {/* OTP */}
            {otpSent && (
              <div className="form-group">
                <label htmlFor="otp">6-digit OTP</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter your OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* MAIN BUTTON */}
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : otpSent
                  ? "Verify OTP & Sign In"
                  : "Send OTP"}
            </button>

            {otpSent && (
              <div className="auth-footer">
                <button
                  type="button"
                  className="password-toggle"
                  onClick={handleChangeEmail}
                  disabled={loading}
                >
                  Change email
                </button>

                <p>
                  Didn't receive the code? Check your spam folder or try again
                  after the resend limit.
                </p>
              </div>
            )}

            <p className="auth-footer">
              Don't have an account?{" "}
              <Link to="/register">Create an account</Link>
            </p>

            <p className="auth-footer">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
