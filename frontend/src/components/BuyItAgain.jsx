import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProductById, formatINR } from "../data/catalog";
import { getBuyAgainProductIds } from "../utils/bspStorage";
import "./Personalization.css";

/*
|--------------------------------------------------------------------------
| BuyItAgain — Amazon-style reorder shelf
|--------------------------------------------------------------------------
| Reads the signed-in shopper's order history from Supabase. If a shopper
| has never ordered anything yet,
| the section renders nothing rather than an awkward empty state — this
| is a "returning customer" feature, not something new users need to see.
*/

export default function BuyItAgain({ limit = 6 }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener("bsp-orders-changed", bump);
    return () => window.removeEventListener("bsp-orders-changed", bump);
  }, []);

  const products = useMemo(() => {
    return getBuyAgainProductIds(limit)
      .map(getProductById)
      .filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, version]);

  if (products.length === 0) return null;

  return (
    <section className="bsp-section">
      <div className="bsp-section-head">
        <h2>Buy it again</h2>
        <span className="bsp-section-sub">From your past orders</span>
      </div>
      <div className="bsp-scroll-row">
        {products.map((p) => (
          <Link className="bsp-mini-card" to={`/products/${p.id}`} key={p.id}>
            <img src={p.image} alt={p.name} loading="lazy" />
            <p className="bsp-mini-name">{p.name}</p>
            <div className="bsp-mini-price-row">
              <span className="bsp-mini-price">{formatINR(p.price)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
