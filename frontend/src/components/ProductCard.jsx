import ProductPhoto from "./ProductPhoto";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { addToCart as addToStoredCart } from "../utils/cartStore";
import Swal from "../utils/centeredSwal";
import { discountPercent } from "../data/catalog";
import { productThumbnail } from "../data/additionalProducts";

function ProductCard({ product, onAddToCart, onView }) {
  const pct = discountPercent(product.price, product.mrp);
  const navigate = useNavigate();
  const isOrderable = !product.isDemo && !product.isSampleCatalogProduct && Number(product.id) > 0;
  const outOfStock = Number(product.stock ?? 0) <= 0;
  const fallbackImage = productThumbnail(product.name, product.category, product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(product.id);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = addToStoredCart(product.id, 1);
    if (result.ok) {
      navigate("/checkout");
      return;
    }
    Swal.fire({ icon: "warning", title: "Cannot buy this product",
      text: result.reason === "out-of-stock" ? "This product is out of stock." : "This product is not available for purchase." });
  };

  // The catalogue must never offer fake checkout for frontend-only demos.
  if (!isOrderable) return null;

  return (
    <div className="col-6 col-md-4 col-lg-3">
      <div className="product-card h-100 d-flex flex-column">
        <Link
          to={`/products/${product.id}`}
          onClick={() => onView && onView(product.id)}
          className="text-decoration-none text-dark position-relative"
        >
          <ProductPhoto product={product}
            src={product.image || product.images?.[0] || product.imageUrl || fallbackImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width="300"
            height="300"
            style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "10px" }}
          />
          {pct > 0 && (
            <span
              className="badge bg-success position-absolute"
              style={{ top: 8, left: 8 }}
            >
              {pct}% off
            </span>
          )}

          <h3 className="h6 mt-2 mb-1">{product.name}</h3>
        </Link>

        {product.description && <p className="text-muted small mb-1">{product.description}</p>}

        <div className="d-flex align-items-center gap-2 mb-1">
          <p className="fw-bold mb-0">₹{product.price}</p>
          {pct > 0 && <span className="text-muted text-decoration-line-through small">₹{product.mrp}</span>}
          {product.rating && (
            <span className="badge bg-success ms-auto">★ {product.rating.toFixed(1)}</span>
          )}
        </div>

        <div className="d-flex gap-2 mt-auto">
          <button type="button" className="btn btn-dark btn-sm flex-fill"
            onClick={handleAddToCart} disabled={outOfStock} title={outOfStock ? "Out of stock" : "Add to cart"}>
            Add to Cart
          </button>
          <button type="button" className="btn btn-outline-dark btn-sm flex-fill"
            onClick={handleBuyNow} disabled={outOfStock} title={outOfStock ? "Out of stock" : "Buy now"}>
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
