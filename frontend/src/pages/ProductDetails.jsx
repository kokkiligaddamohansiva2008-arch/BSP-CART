import ProductPhoto from "../components/ProductPhoto";
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
import Swal from "../utils/centeredSwal";
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
import { productThumbnail } from "../data/additionalProducts";
import "./ProductDetails.css";
import { getProductReviews, submitVerifiedReview } from "../services/buyerFeatures";

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
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.id);
      setWishlisted(isWishlisted(product.id));
      setActiveImage(0);
      setQuantity(1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product]);

  useEffect(() => {
    let mounted = true;
    if (Number(id) <= 0) return;
    getProductReviews(id).then((items) => { if (mounted) setReviews(items); })
      .catch((error) => { if (mounted) setReviewsError(error.message); });
    return () => { mounted = false; };
  }, [id]);

  const saveReview = async (event) => {
    event.preventDefault();
    setReviewSaving(true);
    try {
      await submitVerifiedReview(id, reviewRating, reviewText);
      setReviews(await getProductReviews(id));
      setReviewText("");
      Swal.fire({ icon: "success", title: "Verified review saved" });
    } catch (error) {
      Swal.fire({ icon: "warning", title: "Cannot submit review", text: error.message });
    } finally { setReviewSaving(false); }
  };

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

  const fallbackImage = productThumbnail(product.name, product.category, product.id);
  const previewOnly = product.isSampleCatalogProduct || Number(product.id) <= 0;
  const purchasable = !previewOnly && Number(product.stock ?? 0) > 0;
  const effectivePrice = product.deal ? product.deal.price : product.price;
  const pct = discountPercent(effectivePrice, product.mrp);
  const related = getRelatedProducts(product);
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
      text: result.ok ? `${quantity} × ${product.name}` : result.reason === "demo" ? "This is a sample catalogue preview, not an orderable product." : "This product is out of stock.",
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleBuyNow = () => {
    const result = addToStoredCart(product.id, quantity);
    if (result.ok) navigate("/checkout");
    else Swal.fire({ icon: "warning", title: "Cannot buy this product", text: result.reason === "demo" ? "This is a preview listing. Choose a real available product." : "This item is out of stock." });
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
            <ProductPhoto product={product} src={product.images?.[activeImage] || product.image || fallbackImage} alt={product.name} />
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
                  <ProductPhoto product={product} src={src} alt={`${product.name} ${idx + 1}`} />
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
            <select name="pd-qty"
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
            <button className="pd-btn pd-btn-primary" disabled={!purchasable} onClick={handleAddToCart}>
              {previewOnly ? "Preview only" : purchasable ? "Add to Cart" : "Out of stock"}
            </button>
            <button className="pd-btn pd-btn-buy" disabled={!purchasable} onClick={handleBuyNow}>
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

        {/* Price history */}
        <div className="pd-side">
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
            <p className="pd-muted-note">Last 7 weeks — lowest price is highlighted by the current deal, if any.</p>
          </div>
        </div>
      </div>

      {/* Verified-purchase reviews persisted to Supabase. */}
      <section className="pd-reviews">
        <h2>Verified buyer ratings & reviews</h2>
        <div className="pd-reviews-summary">
          <span className="pd-reviews-score">
            {reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "—"}
          </span>
          <span>{reviews.length} verified purchase reviews</span>
        </div>
        {Number(product.id) > 0 && (
          <form onSubmit={saveReview} className="mb-4 d-grid gap-2" style={{ maxWidth: 560 }}>
            <label htmlFor="verified-rating">Your rating (delivered orders only)</label>
            <select id="verified-rating" className="form-select" value={reviewRating}
              onChange={(event) => setReviewRating(Number(event.target.value))}>
              {[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}
            </select>
            <label htmlFor="verified-comment">Review</label>
            <textarea id="verified-comment" className="form-control" rows={3}
              minLength={10} maxLength={2000} required value={reviewText}
              placeholder="Describe your experience after delivery..."
              onChange={(event) => setReviewText(event.target.value)} />
            <button type="submit" className="pd-btn pd-btn-primary" disabled={reviewSaving}>
              {reviewSaving ? "Saving…" : "Submit verified review"}
            </button>
            <small>Only buyers with a delivered order for this product can submit a review.</small>
          </form>
        )}
        {reviewsError && <p role="alert">{reviewsError}</p>}
        {reviews.length === 0 && <p>No verified reviews yet.</p>}
        <div className="pd-reviews-list">
          {reviews.map((review) => (
            <div className="pd-review" key={review.id}>
              <div className="pd-review-head">
                <Stars value={review.rating} />
                <strong>Verified purchase</strong>
                <span className="pd-review-date">{new Date(review.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              <p>{review.comment}</p>
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
                  <ProductPhoto product={p}
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                  />
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
