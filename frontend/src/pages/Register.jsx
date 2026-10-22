import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { hashPassword } from "../utils/hash";
import "./Login.css";

function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0-4
}
const METER = [
  { w: "8%", c: "#b5533c", t: "Too weak" },
  { w: "30%", c: "#b5533c", t: "Weak" },
  { w: "55%", c: "#d9a441", t: "Okay" },
  { w: "80%", c: "#6aa84f", t: "Good" },
  { w: "100%", c: "#1f8a4c", t: "Strong" },
];

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(params.get("role")?.toLowerCase() === "seller" ? "seller" : "buyer");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const s = METER[password ? Math.max(0, strength(password)) : 0];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const user = username.trim();
    if (!name.trim() || !user || !password || !confirmPassword) return setError("Please fill in all fields.");
    if (user.length < 3) return setError("Username must be at least 3 characters.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    let users = [];
    try {
      users = JSON.parse(localStorage.getItem("bsp_users") || "[]");
    } catch {
      users = [];
    }
    if (users.some((u) => u.username.toLowerCase() === user.toLowerCase())) {
      return setError("That username is already taken.");
    }

    users.push({
      name: name.trim(),
      username: user,
      passwordHash: await hashPassword(password),
      role: role.toUpperCase(),
    });
    localStorage.setItem("bsp_users", JSON.stringify(users));

    Swal.fire({
      icon: "success",
      title: "Account created!",
      text: "Please sign in to continue.",
      confirmButtonText: "Go to sign in",
    }).then(() => navigate("/login"));
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-brand" aria-hidden="true">BC</div>
        <h1>Create your account</h1>
        <p className="login-sub">Join BSP CART in a few seconds</p>

        <form onSubmit={handleRegister} noValidate>
          <label>I want to</label>
          <div className="role-pick">
            <button type="button" className={role === "buyer" ? "active" : ""} onClick={() => setRole("buyer")}>
              🛍️ Shop
            </button>
            <button type="button" className={role === "seller" ? "active" : ""} onClick={() => setRole("seller")}>
              🏪 Sell
            </button>
          </div>

          <label htmlFor="name">Full name</label>
          <input id="name" type="text" autoComplete="name" placeholder="Your full name"
            value={name} onChange={(e) => setName(e.target.value)} />

          <label htmlFor="username">Username</label>
          <input id="username" type="text" autoComplete="username" placeholder="Choose a username"
            value={username} onChange={(e) => setUsername(e.target.value)} />

          <label htmlFor="password">Password</label>
          <div className="pw-wrap">
            <input id="password" type={showPw ? "text" : "password"} autoComplete="new-password"
              placeholder="At least 6 characters" value={password}
              onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          {password && (
            <>
              <div className="pw-meter"><span style={{ width: s.w, background: s.c }} /></div>
              <div className="pw-hint">{s.t}</div>
            </>
          )}

          <label htmlFor="confirm">Confirm password</label>
          <input id="confirm" type={showPw ? "text" : "password"} autoComplete="new-password"
            placeholder="Re-enter your password" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} />

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit">Create account</button>
        </form>

        <p className="signup-prompt">
          Already have an account?{" "}
          <button type="button" className="link-btn" onClick={() => navigate("/login")}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
