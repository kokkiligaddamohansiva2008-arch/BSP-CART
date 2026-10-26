import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAuthContext } from "../context/AuthContext";
import SocialButtons from "../components/auth/SocialButtons";
import "./Login.css";

const homeFor = (role) =>
  role === "SELLER"
    ? "/seller/dashboard"
    : role === "ADMIN"
      ? "/admin/dashboard"
      : "/buyer/dashboard";

// Errors that come back from the OAuth provider arrive in the URL.
function oauthErrorFromUrl() {
  const raw = `${window.location.search}&${window.location.hash.replace(/^#/, "")}`;
  const params = new URLSearchParams(raw);
  const msg = params.get("error_description");
  return msg ? msg.replace(/\+/g, " ") : "";
}

export function AuthAside({ title, text }) {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-brand">
        <span className="auth-aside-mark">BC</span>
        <span>BSP CART</span>
      </div>

      <div className="auth-aside-body">
        <h2>{title}</h2>
        <p>{text}</p>
        <ul>
          <li>Thousands of products from trusted sellers</li>
          <li>Track orders, returns and payments in one place</li>
          <li>Open your own shop in minutes</li>
        </ul>
      </div>

      <small>© {new Date().getFullYear()} BSP CART</small>
    </aside>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const { ready, user } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(() => oauthErrorFromUrl());
  const [busy, setBusy] = useState(false);

  // Already signed in (or just returned from Google / GitHub) → go to the right dashboard.
  useEffect(() => {
    if (ready && user) navigate(from || homeFor(user.role), { replace: true });
  }, [ready, user, from, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env");
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
      <div className="auth-shell">
        <AuthAside
          title="Welcome back to the bazaar."
          text="Sign in to pick up where you left off — your cart, orders and wishlist are waiting."
        />

        <div className="login-box">
          <h1>Sign in</h1>
          <p className="login-sub">Use your social account or your email</p>

          <SocialButtons verb="Sign in" onError={setError} disabled={busy} />

          <div className="auth-divider"><span>or sign in with email</span></div>

          <form onSubmit={handleLogin} noValidate>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
            <button type="button" className="link-btn" onClick={() => navigate("/register")}>
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
