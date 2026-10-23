import { useEffect, useState } from "react";
import { loadProducts } from "../data/catalog";
import { isSupabaseConfigured } from "../lib/supabase";

/*
| Loads the product catalog from Supabase once before the app renders, so
| every page can keep reading PRODUCTS synchronously.
*/
export default function ProductsGate({ children }) {
  const [state, setState] = useState(isSupabaseConfigured ? "loading" : "missing-config");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    loadProducts()
      .then(() => setState("ready"))
      .catch((e) => {
        setMessage(e.message || "Could not reach Supabase");
        setState("error");
      });
  }, []);

  if (state === "ready") return children;

  return (
    <div style={{ padding: "4rem 1.5rem", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
      {state === "loading" && <p>Loading the bazaar…</p>}
      {state === "missing-config" && (
        <>
          <h2>Supabase isn't configured</h2>
          <p>
            Copy <code>frontend/.env.example</code> to <code>frontend/.env</code>, fill in
            <code> VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart <code>npm run dev</code>.
          </p>
        </>
      )}
      {state === "error" && (
        <>
          <h2>Couldn't load products</h2>
          <p>{message}</p>
          <p>Did you run <code>supabase/schema.sql</code> and <code>supabase/seed.sql</code>?</p>
        </>
      )}
    </div>
  );
}
