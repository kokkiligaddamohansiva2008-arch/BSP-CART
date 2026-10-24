import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { isSupabaseConfigured } from "../lib/supabase";
import "./Login.css";

const homeFor = (role) =>
  role === "SELLER"
    ? "/seller/dashboard"
    : role === "ADMIN"
      ? "/admin/dashboard"
      : "/buyer/dashboard";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env"
      );
      return;
    }

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setBusy(true);

    try {
      const { profile } = await login(email.trim(), password);
      const role = String(profile?.role || "BUYER").toUpperCase();

      navigate(from || homeFor(role), { replace: true });
    } catch (err) {
      const message = err?.message || "";

      setError(
        /invalid login/i.test(message)
          ? "Invalid email or password."
          : /confirm/i.test(message)
            ? "Please confirm your email first (check your inbox)."
            : message || "Could not sign in."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-brand" aria-hidden="true">
          BC
        </div>

        <h1>Welcome back</h1>
        <p className="login-sub">
          Sign in to your BSP CART account
        </p>

        <form onSubmit={handleLogin} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password">Password</label>

          <div className="pw-wrap">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="signup-prompt">
          New to BSP CART?{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => navigate("/register")}
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}