import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { hashPassword } from "../utils/hash";
import "./Login.css";

// Prototype-only admin account, read from .env (VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD)
// instead of being hard-coded in source. NOTE: Vite still bundles these values into the
// browser build, so real admin authentication must move to the backend before going live.
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const homeFor = (role) =>
  role === "SELLER" ? "/seller/dashboard" : role === "ADMIN" ? "/admin/dashboard" : "/buyer/dashboard";

function saveSession({ token, role, username, name }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("userId", username);
  localStorage.setItem("name", name);
  localStorage.setItem("username", username);
  window.dispatchEvent(new Event("bsp-session-changed"));
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const user = username.trim();
    if (!user || !password) {
      setError("Please enter both username and password.");
      return;
    }

    if (ADMIN_USERNAME && ADMIN_PASSWORD && user === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      saveSession({ token: "admin-token-" + Date.now(), role: "ADMIN", username: user, name: "BSP CART Admin" });
      navigate(from || homeFor("ADMIN"), { replace: true });
      return;
    }

    let users = [];
    try {
      users = JSON.parse(localStorage.getItem("bsp_users") || "[]");
    } catch {
      users = [];
    }

    const hash = await hashPassword(password);
    const match = users.find(
      (u) => u.username === user && (u.passwordHash ? u.passwordHash === hash : u.password === password)
    );

    // Upgrade accounts created before hashing was added
    if (match && !match.passwordHash) {
      match.passwordHash = hash;
      delete match.password;
      localStorage.setItem("bsp_users", JSON.stringify(users));
    }

    if (!match) {
      setError("Invalid username or password.");
      return;
    }

    const role = (match.role || "buyer").toUpperCase();
    saveSession({ token: "mock-token-" + Date.now(), role, username: user, name: match.name || user });
    navigate(from || homeFor(role), { replace: true });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-brand" aria-hidden="true">BC</div>
        <h1>Welcome back</h1>
        <p className="login-sub">Sign in to your BSP CART account</p>

        <form onSubmit={handleLogin} noValidate>
          <label htmlFor="username">Username</label>
          <input
            id="username" type="text" autoComplete="username" autoFocus
            placeholder="Enter your username"
            value={username} onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <div className="pw-wrap">
            <input
              id="password" type={showPw ? "text" : "password"} autoComplete="current-password"
              placeholder="Enter your password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit">Sign in</button>
        </form>

        <p className="signup-prompt">
          New to BSP CART?{" "}
          <button type="button" className="link-btn" onClick={() => navigate("/register")}>
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
