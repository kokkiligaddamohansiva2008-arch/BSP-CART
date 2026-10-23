import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Swal from "sweetalert2";
import {
  getProductById,
  getRelatedProducts,
  formatINR,
  discountPercent,
} from "../data/catalog";
import { addRecentlyViewed, isWishlisted, toggleWishlist } from "../utils/bspStorage";
import { addToCart as addToStoredCart } from "../utils/cartStore";
import DealCountdown from "../components/DealCountdown";
import RecommendedProducts from "../components/RecommendedProducts";
import "./ProductDetails.css";

const EMI_ANNUAL_RATE = 0.14; // representative 14% p.a., shown for illustration only
const EMI_TENURES = [3, 6, 9, 12];

function calculateEmi(principal, months, annualRate = EMI_ANNUAL_RATE) {
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return emi;
}

// Deterministic mock reviews so the page doesn't feel empty
function buildMockReviews(product) {
  if (!product) return [];
  const templates = [
    { name: "uday R.", days: 3, comment: "Exactly as described, delivery was quick too." },
    { name: "tharun V.", days: 9, comment: "Good quality for the price. Would buy again." },
    { name: "narendra S.", days: 21, comment: "Packaging could be better but the product itself is great." },
  ];
  return templates.map((t, i) => ({
    id: `${product.id}-r${i}`,
    name: t.name,
    rating: Math.max(3, Math.round(product.rating) - (i % 2)),
    comment: t.comment,
    daysAgo: t.days,
  }));
}

function Stars({ value }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="pd-stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "pd-star pd-star-full" : "pd-star"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = useMemo(() => getProductById(id), [id]);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [tenure, setTenure] = useState(EMI_TENURES[1]);

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.id);
      setWishlisted(isWishlisted(product.id));
      setActiveImage(0);
      setQuantity(1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product]);

  if (!product) {
    return (
      <div className="pd-not-found">
        <h2>Product not found</h2>
        <p>This item may have been removed or the link is incorrect.</p>
        <button className="pd-btn pd-btn-primary" onClick={() => navigate("/products")}>
          Back to Products
        </button>
      </div>
    );
  }

  const effectivePrice = product.deal ? product.deal.price : product.price;
  const pct = discountPercent(effectivePrice, product.mrp);
  const related = getRelatedProducts(product);
  const reviews = buildMockReviews(product);
  const priceHistoryData = (product.priceHistory || []).map((price, idx) => ({
    label: `W${idx + 1}`,
    price,
  }));

  const handleWishlist = () => {
    const nowWishlisted = toggleWishlist(product.id);
    setWishlisted(nowWishlisted);
  };

  const handleAddToCart = () => {
    const result = addToStoredCart(product.id, quantity);
    Swal.fire({
      icon: result.ok ? "success" : "warning",
      title: result.ok ? "Added to cart" : "Can't add this item",
      text: result.ok ? `${quantity} × ${product.name}` : "This product is out of stock.",
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleBuyNow = () => {
    const result = addToStoredCart(product.id, quantity);
    if (result.ok) navigate("/checkout");
  };

  return (
    <div className="pd-container">
      <nav className="pd-breadcrumb">
        <Link to="/">Home</Link> / <Link to="/products">Products</Link> / <span>{product.name}</span>
      </nav>

      <div className="pd-main">
        {/* Gallery */}
        <div className="pd-gallery">
          <div className="pd-gallery-main">
            <img src={product.images?.[activeImage] || product.image} alt={product.name} />
            {product.deal && <span className="pd-deal-ribbon">Limited-time deal</span>}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="pd-gallery-thumbs">
              {product.images.map((src, idx) => (
                <button
                  key={idx}
                  className={"pd-thumb" + (idx === activeImage ? " active" : "")}
                  onClick={() => setActiveImage(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={src} alt={`${product.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pd-info">
          <h1>{product.name}</h1>
          <p className="pd-seller">
            Sold by <strong>{product.seller}</strong>
          </p>

          <div className="pd-rating-row">
            <Stars value={product.rating} />
            <span className="pd-rating-value">{product.rating.toFixed(1)}</span>
            <span className="pd-rating-count">({product.ratingCount.toLocaleString("en-IN")} ratings)</span>
            {product.bestseller && <span className="pd-bestseller-badge">#1 Bestseller</span>}
          </div>

          <div className="pd-price-block">
            {product.deal && (
              <div className="pd-deal-row">
                <span className="pd-deal-tag">Deal price</span>
                <DealCountdown endsInMinutes={product.deal.endsInMinutes} />
              </div>
            )}
            <div className="pd-price-main">
              <span className="pd-price">{formatINR(effectivePrice)}</span>
              {pct > 0 && (
                <>
                  <span className="pd-mrp">{formatINR(product.mrp)}</span>
                  <span className="pd-discount">{pct}% off</span>
                </>
              )}
            </div>
            <p className="pd-inclusive">Inclusive of all taxes</p>
          </div>

          <ul className="pd-highlights">
            {(product.highlights || []).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>

          <p className={"pd-stock" + (product.stock < 10 ? " low" : "")}>
            {product.stock === 0
              ? "Out of stock"
              : product.stock < 10
              ? `Only ${product.stock} left — order soon`
              : "In stock"}
          </p>

          <div className="pd-qty-row">
            <label htmlFor="pd-qty">Qty</label>
            <select
              id="pd-qty"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={product.stock === 0}
            >
              {Array.from({ length: Math.min(product.stock, 10) || 1 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="pd-actions">
            <button className="pd-btn pd-btn-primary" disabled={product.stock === 0} onClick={handleAddToCart}>
              Add to Cart
            </button>
            <button className="pd-btn pd-btn-buy" disabled={product.stock === 0} onClick={handleBuyNow}>
              Buy Now
            </button>
            <button
              className={"pd-btn pd-btn-wishlist" + (wishlisted ? " active" : "")}
              onClick={handleWishlist}
            >
              {wishlisted ? "♥ Wishlisted" : "♡ Add to Wishlist"}
            </button>
          </div>

          <p className="pd-description">{product.description}</p>
        </div>

        {/* EMI + Price history */}
        <div className="pd-side">
          <div className="pd-card">
            <h3>EMI options</h3>
            <div className="pd-emi-tenures">
              {EMI_TENURES.map((t) => (
                <button
                  key={t}
                  className={"pd-emi-pill" + (t === tenure ? " active" : "")}
                  onClick={() => setTenure(t)}
                >
                  {t} mo
                </button>
              ))}
            </div>
            <p className="pd-emi-amount">
              {formatINR(Math.round(calculateEmi(effectivePrice, tenure)))}
              <span>/month</span>
            </p>
            <p className="pd-emi-note">
              Estimated at {Math.round(EMI_ANNUAL_RATE * 100)}% p.a. — illustrative only, subject to bank/card
              approval.
            </p>
          </div>

          <div className="pd-card">
            <h3>Price history</h3>
            <div className="pd-chart-wrap">
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={priceHistoryData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" domain={["dataMin - 20", "dataMax + 20"]} />
                  <Tooltip formatter={(value) => formatINR(value)} />
                  <Line type="monotone" dataKey="price" stroke="#B5533C" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="pd-emi-note">Last 7 weeks — lowest price is highlighted by the current deal, if any.</p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="pd-reviews">
        <h2>Ratings & Reviews</h2>
        <div className="pd-reviews-summary">
          <span className="pd-reviews-score">{product.rating.toFixed(1)}</span>
          <div>
            <Stars value={product.rating} />
            <p className="pd-rating-count">{product.ratingCount.toLocaleString("en-IN")} global ratings</p>
          </div>
        </div>
        <div className="pd-reviews-list">
          {reviews.map((r) => (
            <div className="pd-review" key={r.id}>
              <div className="pd-review-head">
                <Stars value={r.rating} />
                <span className="pd-review-name">{r.name}</span>
                <span className="pd-review-date">{r.daysAgo} days ago</span>
              </div>
              <p>{r.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="pd-related">
          <h2>Related products</h2>
          <div className="pd-related-grid">
            {related.map((p) => {
              const relPct = discountPercent(p.price, p.mrp);
              return (
                <Link className="pd-related-card" to={`/products/${p.id}`} key={p.id}>
                  <img src={p.image} alt={p.name} />
                  <p className="pd-related-name">{p.name}</p>
                  <div className="pd-related-price-row">
                    <span>{formatINR(p.price)}</span>
                    {relPct > 0 && <span className="pd-related-discount">{relPct}% off</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <RecommendedProducts excludeId={product.id} />
    </div>
  );
}
