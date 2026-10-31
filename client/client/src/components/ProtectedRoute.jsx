import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiRequest, clearAuthSession, getToken, homeFor, setAuthSession } from "../data/store";

// Protects routes by asking the backend to verify the JWT on every protected-route mount.
// The browser only keeps the token/session; authorization is decided by the API.
export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [account, setAccount] = useState(null);

  useEffect(() => {
    let active = true;
    const token = getToken();

    if (!token) {
      setStatus("unauthenticated");
      return () => { active = false; };
    }

    setStatus("checking");

    apiRequest("/api/auth/me")
      .then((data) => {
        if (!active) return;
        if (!data?.user) throw new Error("Authentication response was invalid.");

        // Refresh the stored user from the server so role/status changes are respected.
        setAuthSession(data.user, token);
        setAccount(data.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        clearAuthSession();
        setAccount(null);
        setStatus("unauthenticated");
      });

    return () => { active = false; };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <span>Checking authentication...</span>
      </div>
    );
  }

  if (status !== "authenticated" || !account || account.status === "suspended") {
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(account.role)) {
    return <Navigate to={homeFor(account.role)} replace />;
  }

  return children;
}
