
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../data/store";
import "../Auth.css";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentDemo() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  async function handleDemoCheckout() {
    setLoading(true);
    setError("");
    setMessage("");
    setVerified(false);

    try {
      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error("Unable to load Razorpay Checkout. Check your connection.");
      }

      const order = await apiRequest("/api/payments/order", {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!order.keyId || !order.orderId) {
        throw new Error("The server did not return a valid test order.");
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "AI StudyHub",
        description: "Test-mode payment demonstration",
        order_id: order.orderId,

        handler: async (response) => {
          try {
            const result = await apiRequest("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify(response),
            });

            if (result.verified === true) {
              setVerified(true);
              setMessage(result.message);
            } else {
              setError("The server did not confirm this payment.");
            }
          } catch (err) {
            setError(
              err.message ||
                "Payment verification failed. Do not treat this payment as verified."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },

        theme: {
          color: "#7c3aed",
        },
      });

      checkout.on("payment.failed", (response) => {
        setError(
          response.error?.description || "The test payment failed."
        );
        setLoading(false);
      });

      checkout.open();
    } catch (err) {
      setError(err.message || "Unable to start the test checkout.");
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
              Test the payment.
              <br />
              Keep learning free.
            </h1>
            <p>
              Explore the Razorpay payment flow in test mode. This is a
              demonstration and does not unlock additional paid features.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature">
              <span className="feature-icon">✓</span>
              No real-money charges in test mode
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              Server-side signature verification
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              Premium remains free
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-form">
            <Link to="/settings" className="back-home">
              <span>←</span>
              Back to Settings
            </Link>

            <h2>Razorpay test checkout</h2>
            <p className="auth-subtitle">
              Demo amount: ₹99. Test transactions only.
            </p>

            {error && <div className="error-message">{error}</div>}

            {message && (
              <div className="success-message" role="status">
                {message}
              </div>
            )}

            {verified && (
              <p className="auth-subtitle">
                This transaction was verified as a test payment. Your Premium
                access remains free and was not granted based on this payment.
              </p>
            )}

            <button
              type="button"
              className="auth-button"
              onClick={handleDemoCheckout}
              disabled={loading}
            >
              {loading ? "Processing..." : "Open Test Checkout"}
            </button>

            <p className="auth-footer">
              This page is for development demonstrations only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
