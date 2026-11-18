import { createClient } from "npm:@supabase/supabase-js@2.118.0";

/** Public, rate-limited newsletter endpoint. No service secrets reach the browser. */
const url = Deno.env.get("SUPABASE_URL") || "";
const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
if (!url || !secret) throw new Error("Supabase server configuration is unavailable");
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const homepage = "https://bsp-cart-frontend.vercel.app";
const emailCheck = /^[^\s@<>,;]+@[^\s@<>,;]+\.[a-z]{2,}$/i;
const mailKeys = ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_SENDER_EMAIL"];
function originAllowed(o: string) {
  const extra = (Deno.env.get("NEWSLETTER_ALLOWED_ORIGINS") || "").split(",").map(s => s.trim());
  return o === homepage || o === "http://localhost:5173" || o === "http://127.0.0.1:5173" ||
    extra.includes(o) || /^https:\/\/bspcart-[a-z0-9-]+-bspcart\.vercel\.app$/.test(o);
}
function response(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": originAllowed(origin) ? origin : homepage,
      "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" },
  });
}
async function hashIp(ip: string) {
  const bytes = new TextEncoder().encode((Deno.env.get("NEWSLETTER_IP_SALT") || "bsp-newsletter-v1") + ":" + ip);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, "0")).join("");
}
function base64url(raw: string) {
  const bytes = new TextEncoder().encode(raw);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function sendGmail(recipient: string, unsubscribeToken: string): Promise<boolean> {
  if (!mailKeys.every(k => Boolean(Deno.env.get(k)))) return false;
  const sender = Deno.env.get("GMAIL_SENDER_EMAIL")!;
  if (!emailCheck.test(sender)) return false;
  const auth = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: Deno.env.get("GMAIL_CLIENT_ID")!,
      client_secret: Deno.env.get("GMAIL_CLIENT_SECRET")!,
      refresh_token: Deno.env.get("GMAIL_REFRESH_TOKEN")!,
    }),
  });
  if (!auth.ok) { console.error("Gmail authentication failed", auth.status); return false; }
  const token = (await auth.json()).access_token;
  const optout = url + "/functions/v1/newsletter?unsubscribe=" + encodeURIComponent(unsubscribeToken);
  const body = [
    "You are subscribed successfully!",
    "",
    "Thank you for subscribing to BSP CART.",
    "You will receive our product and offer updates.",
    "",
    "Shop: " + homepage,
    "Unsubscribe: " + optout,
  ].join("\r\n");
  const mime = [
    "From: BSP CART <" + sender + ">",
    "To: " + recipient,
    "Subject: You are subscribed to BSP CART",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "List-Unsubscribe: <" + optout + ">",
    "", body,
  ].join("\r\n");
  const out = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: base64url(mime) }),
  });
  if (!out.ok) console.error("Gmail confirmation not sent", out.status);
  return out.ok;
}
Deno.serve(async req => {
  const origin = req.headers.get("Origin") || "";
  if (req.method === "OPTIONS") return response({}, originAllowed(origin) ? 200 : 403, origin);
  if (origin && !originAllowed(origin)) return response({ error: "Origin not allowed" }, 403, origin);
  if (req.method === "GET") {
    const token = new URL(req.url).searchParams.get("unsubscribe") || "";
    if (!/^[a-f0-9-]{36}$/i.test(token)) return new Response("Invalid unsubscribe link", { status: 400 });
    const { error } = await db.from("newsletter_subscribers").update({ is_active: false }).eq("unsubscribe_token", token);
    return new Response(error ? "Could not unsubscribe. Please try again." : "You have unsubscribed from BSP CART.", {
      status: error ? 500 : 200, headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);
  if (Number(req.headers.get("content-length") || 0) > 4096) return response({ error: "Request too large" }, 413, origin);
  let data: Record<string, unknown>;
  try { data = await req.json(); } catch { return response({ error: "Invalid request" }, 400, origin); }
  // Honeypot field deliberately hidden from people.
  if (data.website) return response({ subscribed: true, emailSent: false }, 200, origin);
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (email.length > 254 || !emailCheck.test(email)) return response({ error: "Enter a valid email address." }, 400, origin);
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const ipHash = await hashIp(ip);
  const { data: limit, error: limitErr } = await db.from("newsletter_rate_limits").select("attempts,window_started").eq("ip_hash", ipHash).maybeSingle();
  if (limitErr) return response({ error: "Subscription unavailable" }, 503, origin);
  const withinWindow = !!limit && Date.now() - Date.parse(limit.window_started) < 15 * 60 * 1000;
  if (withinWindow && limit.attempts >= 5) return response({ error: "Too many attempts. Please try later." }, 429, origin);
  const { error: countErr } = await db.from("newsletter_rate_limits").upsert({
    ip_hash: ipHash,
    window_started: withinWindow ? limit.window_started : new Date().toISOString(),
    attempts: withinWindow ? limit.attempts + 1 : 1,
  });
  if (countErr) return response({ error: "Subscription unavailable" }, 503, origin);
  const { data: saved, error } = await db.from("newsletter_subscribers")
    .insert({ email }).select("id,unsubscribe_token").single();
  // Avoid revealing whether someone else is already subscribed.
  if (error?.code === "23505") return response({ subscribed: true, emailSent: false }, 200, origin);
  if (error || !saved) return response({ error: "Couldn't subscribe. Please try again." }, 503, origin);
  let emailSent = false;
  try { emailSent = await sendGmail(email, saved.unsubscribe_token); }
  catch (e) { console.error("Newsletter confirmation failed", String(e)); }
  if (emailSent) await db.from("newsletter_subscribers").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", saved.id);
  return response({ subscribed: true, emailSent }, 200, origin);
});
