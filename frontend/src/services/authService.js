import { supabase } from "../lib/supabase";
import { applySession, clearSession, getSession } from "../utils/session";

/*
|--------------------------------------------------------------------------
| Auth (Supabase Auth: email + password)
|--------------------------------------------------------------------------
*/

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, email, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const getProfileById = fetchProfile;

export async function register({ name, username, email, password, role }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name: name.trim(),
        username: username.trim(),
        role: String(role || "BUYER").toUpperCase(),
      },
    },
  });
  if (error) throw error;
  // If "Confirm email" is ON in Supabase, there is no session until the link is clicked.
  return { needsConfirmation: !data.session, user: data.user };
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;

  const profile = await fetchProfile(data.user.id);
  applySession(data.session, profile);
  return { session: data.session, profile };
}

export async function logout() {
  await supabase.auth.signOut();
  clearSession();
}

/*
| Called once at app start: restores the session, keeps the mirror in sync
| on login / logout / token refresh (also across browser tabs).
*/
let started = false;
export async function initAuth() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    try {
      applySession(data.session, await fetchProfile(data.session.user.id));
    } catch {
      applySession(data.session, null);
    }
  } else {
    clearSession();
  }

  if (!started) {
    started = true;
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) return clearSession();
      if (event === "TOKEN_REFRESHED") {
        localStorage.setItem("token", session.access_token);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Defer: calling Supabase inside this callback can dead-lock the client.
        setTimeout(async () => {
          try {
            applySession(session, await fetchProfile(session.user.id));
          } catch {
            applySession(session, null);
          }
        }, 0);
      }
    });
  }
}

export const isAuthenticated = () => !!localStorage.getItem("token");
export const getCurrentUser = () => getSession();
export const getToken = () => localStorage.getItem("token");
