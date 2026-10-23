/*
| BSP CART — session mirror
| Supabase owns the real session (JWT + refresh token). These helpers mirror
| the few fields the UI reads synchronously (role, name, username …) into
| localStorage so Navbar / Sidebar / Profile keep working unchanged.
| The mirror is only for display & routing — real access control is enforced
| by Row Level Security in the database, so editing these keys grants nothing.
| Logging out removes ONLY the auth keys (never localStorage.clear()).
*/
const AUTH_KEYS = ["token", "role", "userId", "name", "username", "email"];

export function applySession(session, profile) {
  if (!session?.user) return clearSession();
  const u = session.user;
  localStorage.setItem("token", session.access_token);
  localStorage.setItem("userId", u.id);
  localStorage.setItem("email", u.email || "");
  localStorage.setItem("role", String(profile?.role || "BUYER").toUpperCase());
  localStorage.setItem("name", profile?.name || profile?.username || u.email || "User");
  localStorage.setItem("username", profile?.username || "");
  window.dispatchEvent(new Event("bsp-session-changed"));
}

export function clearSession() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("bsp-session-changed"));
}

export function getSession() {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    userId: localStorage.getItem("userId"),
    name: localStorage.getItem("name"),
    username: localStorage.getItem("username"),
    email: localStorage.getItem("email"),
  };
}
