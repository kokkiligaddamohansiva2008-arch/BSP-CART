import { supabase } from "../lib/supabase";
import { applySession, clearSession, getSession } from "../utils/session";

/*
|--------------------------------------------------------------------------
| Auth (Supabase Auth: email + password, Google, Microsoft, GitHub)
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

/*
|--------------------------------------------------------------------------
| Social sign-in (Google / Microsoft / GitHub via Supabase OAuth)
|--------------------------------------------------------------------------
| Enable each provider in Supabase → Authentication → Providers.
| "microsoft" maps to Supabase's "azure" provider.
*/
const OAUTH_PROVIDERS = {
  google: { provider: "google" },
  microsoft: { provider: "azure", scopes: "email" },
  github: { provider: "github", scopes: "read:user user:email" },
};
const PENDING_ROLE_KEY = "bsp-pending-role";

export async function loginWithProvider(key, { role } = {}) {
  const cfg = OAUTH_PROVIDERS[key];
  if (!cfg) throw new Error("Unknown sign-in provider.");

  // Remember if the person chose "Sell" on the register page (only used for brand-new accounts).
  if (String(role || "").toUpperCase() === "SELLER") localStorage.setItem(PENDING_ROLE_KEY, "SELLER");
  else localStorage.removeItem(PENDING_ROLE_KEY);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: cfg.provider,
    options: {
      redirectTo: `${window.location.origin}/login`,
      ...(cfg.scopes ? { scopes: cfg.scopes } : {}),
    },
  });
  if (error) throw error;
}

/*
| OAuth users have no username/role in their metadata. Make sure a profile row
| exists (the SQL trigger in supabase/oauth_setup.sql normally creates it; this
| is the safety net) and apply a "Sell" choice to brand-new accounts only.
*/
async function ensureProfile(user) {
  const pendingSeller = localStorage.getItem(PENDING_ROLE_KEY) === "SELLER";
  const isNew = Date.now() - new Date(user.created_at || 0).getTime() < 2 * 60 * 1000;

  let profile = await fetchProfile(user.id);

  if (!profile) {
    const meta = user.user_metadata || {};
    const base =
      String(meta.user_name || meta.preferred_username || (user.email || "user").split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20) || "user";
    const { data } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        name: meta.full_name || meta.name || base,
        username: `${base}${Math.random().toString(36).slice(2, 6)}`,
        role: pendingSeller && isNew ? "SELLER" : "BUYER",
      })
      .select("id, username, name, email, role")
      .maybeSingle();
    profile = data || (await fetchProfile(user.id));
  } else if (pendingSeller && isNew && profile.role === "BUYER") {
    const { data } = await supabase
      .from("profiles")
      .update({ role: "SELLER" })
      .eq("id", user.id)
      .select("id, username, name, email, role")
      .maybeSingle();
    if (data) profile = data;
  }

  localStorage.removeItem(PENDING_ROLE_KEY);
  return profile;
}

async function loadProfile(user) {
  try {
    return await ensureProfile(user);
  } catch {
    return null;
  }
}

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
    applySession(data.session, await loadProfile(data.session.user));
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
          applySession(session, await loadProfile(session.user));
        }, 0);
      }
    });
  }
}

export const isAuthenticated = () => !!localStorage.getItem("token");
export const getCurrentUser = () => getSession();
export const getToken = () => localStorage.getItem("token");
