/*
| Password hashing for the localStorage prototype (SHA-256 + per-app salt).
| This is NOT a substitute for server-side hashing (bcrypt/argon2) — it just
| stops passwords from sitting in plain text in browser storage.
*/
const SALT = "bsp-cart::";

export async function hashPassword(password) {
  const data = new TextEncoder().encode(SALT + password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
