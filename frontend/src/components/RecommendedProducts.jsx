import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS, formatINR, discountPercent, getProductById } from "../data/catalog";
import { getRecentlyViewed } from "../utils/bspStorage";
import "./Personalization.css";

/*
|--------------------------------------------------------------------------
| RecommendedProducts — "Recommended for you"
|--------------------------------------------------------------------------
| Simple content-based recommender: scores every catalog product by how
| often its category shows up in the shopper's recently-viewed list, then
| falls back to top-rated/bestseller items for new shoppers with no
| history yet (a cold-start default, same idea Amazon uses for new users).
*/

export default function RecommendedProducts({ excludeId, limit = 8, title = "Recommended for you" }) {
  const recommendations = useMemo(() => {
    const viewedIds = getRecentlyViewed();
    const viewedProducts = viewedIds.map(getProductById).filter(Boolean);

    const categoryWeight = {};
    viewedProducts.forEach((p, index) => {
      // more recent views count for more
      const weight = viewedProducts.length - index;
      categoryWeight[p.category] = (categoryWeight[p.category] || 0) + weight;
    });

    const pool = PRODUCTS.filter((p) => p.id !== excludeId);

    const hasHistory = Object.keys(categoryWeight).length > 0;

    const scored = pool.map((p) => {
      const affinity = categoryWeight[p.category] || 0;
      const qualityBoost = (p.rating || 0) + (p.bestseller ? 0.5 : 0);
      return { product: p, score: hasHistory ? affinity * 10 + qualityBoost : qualityBoost };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.product);
  }, [excludeId, limit]);

  if (recommendations.length === 0) return null;

  return (
    <section className="bsp-section">
      <div className="bsp-section-head">
        <h2>{title}</h2>
        <span className="bsp-section-sub">Based on items you've viewed</span>
      </div>
      <div className="bsp-scroll-row">
        {recommendations.map((p) => {
          const pct = discountPercent(p.price, p.mrp);
          return (
            <Link className="bsp-mini-card" to={`/products/${p.id}`} key={p.id}>
              <img src={p.image} alt={p.name} loading="lazy" />
              <p className="bsp-mini-name">{p.name}</p>
              <div className="bsp-mini-price-row">
                <span className="bsp-mini-price">{formatINR(p.price)}</span>
                {pct > 0 && <span className="bsp-mini-mrp">{formatINR(p.mrp)}</span>}
                {pct > 0 && <span className="bsp-mini-discount">{pct}% off</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
