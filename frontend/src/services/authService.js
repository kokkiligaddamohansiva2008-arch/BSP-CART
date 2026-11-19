import { supabase, requireSupabase } from "../lib/supabase";
import { applySession, clearSession, getSession } from "../utils/session";

/*
|--------------------------------------------------------------------------
| Auth (Supabase Auth: email + password, Google, Microsoft, GitHub)
|--------------------------------------------------------------------------
*/

async function fetchProfile(userId) {
  requireSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, email, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const getProfileById = fetchProfile;

/** Activate seller access for an existing signed-in buyer or new seller.
 * The database RPC only upgrades the caller, verifies their email and never
 * accepts a user id or privileged role from the browser. */
export async function activateSellerAccount() {
  requireSupabase();
  const { data: current, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!current.session?.user) throw new Error("Please sign in before opening a seller account.");
  const { error } = await supabase.rpc("activate_seller_account");
  if (error) throw new Error(error.message || "Could not activate seller access.");

  // app_metadata.role is part of the signed JWT, so refresh it after the RPC.
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed.session) {
    throw new Error("Seller activated. Sign out and sign in again to refresh your permissions.");
  }
  const profile = await fetchProfile(refreshed.session.user.id);
  if (!profile || profile.role !== "SELLER") throw new Error("Seller profile was not saved.");
  applySession(refreshed.session, profile);
  return profile;
}



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
  requireSupabase();
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
  let profile = await fetchProfile(user.id);
  if (!profile) {
    // A Supabase Auth trigger creates the profile, including the requested
    // SELLER role. Avoid unauthorised client-side inserts (RLS denies them).
    throw new Error("Profile missing after sign-in. Contact support to restore your account.");
  }

  const pendingSeller = localStorage.getItem(PENDING_ROLE_KEY) === "SELLER";
  if (profile.role !== "ADMIN" &&
      (pendingSeller || profile.role === "SELLER") &&
      user.app_metadata?.role !== "SELLER") {
    profile = await activateSellerAccount();
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
  requireSupabase();
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
  // Supabase deliberately returns non-identifying responses when an email
  // already has an account. We never claim it created a second account.
  let profile = null;
  if (data.session && String(role).toUpperCase() === "SELLER") {
    profile = await activateSellerAccount();
  }
  return { needsConfirmation: !data.session, user: data.user, profile };
}

export async function login(email, password) {
  requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;

  let profile = await fetchProfile(data.user.id);
  if (!profile) throw new Error("Your account profile is missing. Contact support.");
  if (profile.role === "SELLER" && data.user.app_metadata?.role !== "SELLER") {
    profile = await activateSellerAccount();
  }
  applySession((await supabase.auth.getSession()).data.session || data.session, profile);
  return { session: data.session, profile };
}

export async function logout() {
  // Local development may run without the two Vite Supabase variables.
  // Clear the UI session mirror without dereferencing a missing client.
  if (!supabase) {
    clearSession();
    return;
  }
  try {
    await supabase.auth.signOut();
  } finally {
    clearSession();
  }
}

/*
| Called once at app start: restores the session, keeps the mirror in sync
| on login / logout / token refresh (also across browser tabs).
*/
let started = false;
export async function initAuth() {
  // No credentials in the LOCAL Vite build means no Supabase client.
  // Keep the app responsive and let ProductsGate show the setup message.
  // With configured Vercel credentials the original auth flow is unchanged.
  if (!supabase) {
    clearSession();
    if (import.meta.env.DEV) {
      console.warn(
        "[BSP CART] Supabase is not configured locally. Copy " +
        "frontend/.env.example to frontend/.env.local and restart Vite."
      );
    }
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
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
