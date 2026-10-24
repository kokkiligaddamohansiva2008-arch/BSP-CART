import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  CATEGORIES,
  PRODUCTS,
  getDealProducts,
  formatINR,
  discountPercent,
} from "../data/catalog";
import { addRecentlyViewed, getWishlist, toggleWishlist as toggleStoredWishlist } from "../utils/bspStorage";
import { addToCart as addToStoredCart, useCartStore } from "../utils/cartStore";
import DealCountdown from "../components/DealCountdown";
import RecommendedProducts from "../components/RecommendedProducts";
import BuyItAgain from "../components/BuyItAgain";
import "./Home.css";

const getCategoryProducts = (category) =>
  PRODUCTS.filter(
    (p) => String(p.category).toLowerCase() === String(category).toLowerCase()
  );

const getDiscountedProducts = () =>
  PRODUCTS.filter((p) => Number(p.mrp) > Number(p.price))
    .sort(
      (a, b) =>
        discountPercent(b.price, b.mrp) -
        discountPercent(a.price, a.mrp)
    );

const getTopRatedProducts = () =>
  [...PRODUCTS].sort((a, b) => (b.rating || 0) - (a.rating || 0));

const getNewestProducts = () =>
  [...PRODUCTS].sort((a, b) => Number(b.id) - Number(a.id));

const getLowPriceProducts = (limit) =>
  [...PRODUCTS]
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, limit);

export default function Home() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const { items: cartCount } = useCartStore();
  const [wishlist, setWishlist] = useState(() => getWishlist());
  const [couponCopied, setCouponCopied] = useState("");

  const dealProducts = useMemo(() => getDealProducts(), []);

  const discountedProducts = useMemo(
    () => getDiscountedProducts(),
    []
  );

  const topRatedProducts = useMemo(
    () => getTopRatedProducts(),
    []
  );

  const newestProducts = useMemo(
    () => getNewestProducts(),
    []
  );

  const lowPriceProducts = useMemo(
    () => getLowPriceProducts(12),
    []
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return PRODUCTS.filter((p) => {
      const matchesCategory =
        activeCategory === "all" ||
        p.category === activeCategory;

      const searchableText = [
        p.name,
        p.category,
        p.seller,
        p.brand,
        p.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const words = normalizedQuery
        .split(/\s+/)
        .filter(Boolean);

      const matchesQuery =
        words.length === 0 ||
        words.every((word) =>
          searchableText.includes(word)
        );

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

const wishlistCount = wishlist.length;

  const addToCart = (product) => {
    const result = addToStoredCart(product.id, 1);

    Swal.fire({
      icon: result.ok ? "success" : "warning",
      title: result.ok ? "Added to cart" : "Can't add this item",
      text: result.ok
        ? `${product.name} added successfully`
        : "This product is currently out of stock.",
      timer: 1400,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
    });
  };

  const toggleWishlist = (product) => {
    const wasSaved = wishlist.includes(product.id);
    toggleStoredWishlist(product.id);
    setWishlist(getWishlist());

    Swal.fire({
      icon: wasSaved ? "info" : "success",
      title: wasSaved ? "Removed from wishlist" : "Added to wishlist",
      text: product.name,
      timer: 1000,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
    });
  };

  const handleProductClick = (productId) => {
    addRecentlyViewed(productId);
  };

  const browseCategory = (category) => {
    setActiveCategory(category);
    setQuery("");

    setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const copyCoupon = async (coupon) => {
    try {
      await navigator.clipboard.writeText(coupon);
      setCouponCopied(coupon);

      Swal.fire({
        icon: "success",
        title: "Coupon copied",
        text: `${coupon} copied to clipboard`,
        timer: 1200,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });

      setTimeout(() => setCouponCopied(""), 1800);
    } catch {
      Swal.fire({
        icon: "info",
        title: coupon,
        text: "Copy the coupon manually",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const renderProductCard = (product, compact = false) => {
    const pct = discountPercent(product.price, product.mrp);

    return (
      <article
        className={`market-product-card ${
          compact ? "compact-card" : ""
        }`}
        key={product.id}
      >
        <div className="market-product-image">
          <Link
            to={`/products/${product.id}`}
            onClick={() => handleProductClick(product.id)}
          >
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
            />
          </Link>

          {pct > 0 && (
            <span className="discount-ribbon">
              {pct}% OFF
            </span>
          )}

          <button
            className={`wishlist-btn ${
              wishlist.includes(product.id) ? "liked" : ""
            }`}
            onClick={() => toggleWishlist(product)}
            aria-label="Toggle wishlist"
          >
            {wishlist.includes(product.id) ? "♥" : "♡"}
          </button>
        </div>

        <div className="market-product-body">
          <Link
            to={`/products/${product.id}`}
            onClick={() => handleProductClick(product.id)}
            className="market-product-title"
          >
            {product.name}
          </Link>

          <div className="seller-line">
            Sold by {product.seller || "BSP Seller"}
          </div>

          <div className="rating-line">
            {product.rating ? (
              <span className="rating-badge">
                ★ {Number(product.rating).toFixed(1)}
              </span>
            ) : (
              <span className="rating-badge">New</span>
            )}

            {pct > 0 && (
              <span className="discount-text">
                {pct}% off
              </span>
            )}
          </div>

          <div className="price-line">
            <strong>{formatINR(product.price)}</strong>

            {product.mrp && product.mrp > product.price && (
              <span className="old-price">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          <div
            className={`stock-line ${
              product.stock < 10 ? "low-stock" : ""
            }`}
          >
            {product.stock < 10
              ? `Only ${product.stock} left`
              : `${product.stock || 0} in stock`}
          </div>

          <button
            className="market-add-btn"
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </article>
    );
  };

  const renderHorizontalProducts = (
    products,
    sectionClass = ""
  ) => (
    <div className={`horizontal-products ${sectionClass}`}>
      {products.length === 0 ? (
        <div className="section-empty">
          No products available in this section.
        </div>
      ) : (
        products.map((product) =>
          renderProductCard(product, true)
        )
      )}
    </div>
  );

  return (
    <div className="home">

      {/* ======================================================
          TOP MINI BAR
      ====================================================== */}
      <div className="top-offer-bar">
        <div>
          🎉 BSP CART FESTIVAL SALE — Extra savings every day
        </div>

        <div className="top-links">
          <span>24/7 Support</span>
          <span>Become a Seller</span>
          <span>Track Order</span>
        </div>
      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}
      <header className="home-header">

        <Link to="/" className="brand">
          <span className="brand-mark">BC</span>

          <div className="brand-text">
            <span className="brand-name">
              BSP CART
            </span>

            <span className="brand-tag">
              the everyday bazaar
            </span>
          </div>
        </Link>

        <form
          className="search-wrap"
          onSubmit={(e) => {
            e.preventDefault();

            navigate(
              query.trim()
                ? `/products?search=${encodeURIComponent(query)}`
                : "/products"
            );
          }}
        >
          <input id="home-search-for-products" name="search-for-products"
            type="search"
            className="search-input"
            placeholder="Search for products, brands and categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button type="submit" className="search-button">
            🔍 Search
          </button>
        </form>

        <div className="header-actions">

          <button
            className="header-action"
            onClick={() => navigate("/login")}
          >
            👤
            <span>Account</span>
          </button>

          <button
            className="header-action wishlist-header"
            onClick={() =>
              Swal.fire({
                icon: "info",
                title: "Wishlist",
                text: `${wishlistCount} item(s) saved`,
                timer: 1200,
                showConfirmButton: false,
              })
            }
          >
            ♡
            <span>Wishlist</span>

            {wishlistCount > 0 && (
              <b>{wishlistCount}</b>
            )}
          </button>

          <button
            className="header-action cart-header"
            onClick={() => navigate("/cart")}
          >
            🛒
            <span>Cart</span>

            {cartCount > 0 && (
              <b>{cartCount}</b>
            )}
          </button>
        </div>
      </header>

      {/* ======================================================
          CATEGORY NAVIGATION
      ====================================================== */}
      <div className="mega-category-bar">
        <div className="category-menu-item all-menu">
          ☰ All Categories
        </div>

        {CATEGORIES.slice(0, 8).map((category) => (
          <button
            key={category.id}
            onClick={() => browseCategory(category.id)}
            className="category-menu-item"
          >
            {category.label}
          </button>
        ))}

        <button
          className="category-menu-item deal-menu"
          onClick={() =>
            document
              .getElementById("mega-deals")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          🔥 Today's Deals
        </button>
      </div>

      {/* ======================================================
          HERO
      ====================================================== */}
      <section className="hero">

        <div className="hero-copy">

          <span className="hero-eyebrow">
            BIGGEST SHOPPING SEASON
          </span>

          <h1>
            Every stall.
            <br />
            <span>One shopping cart.</span>
          </h1>

          <p>
            Discover groceries, electronics, fashion,
            home essentials and much more from sellers
            across the BSP CART marketplace.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() =>
                document
                  .getElementById("mega-deals")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Shop Today's Deals
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Explore Products
            </button>
          </div>

          <div className="hero-trust-row">
            <span>✓ Secure Shopping</span>
            <span>✓ Trusted Sellers</span>
            <span>✓ Easy Returns</span>
          </div>
        </div>

        <div className="hero-offer-panel">

          <div className="hero-offer-label">
            LIMITED TIME OFFER
          </div>

          <div className="hero-offer-big">
            UP TO
            <strong>80%</strong>
            OFF
          </div>

          <div className="hero-offer-line">
            On selected products
          </div>

          <DealCountdown
            endsInMinutes={180}
            compact
          />

          <button
            onClick={() =>
              document
                .getElementById("mega-deals")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Grab the Deal →
          </button>
        </div>
      </section>

      {/* ======================================================
          QUICK BENEFITS
      ====================================================== */}
      <section className="benefit-strip">

        <div className="benefit-item">
          <span>🚚</span>
          <div>
            <strong>Fast Delivery</strong>
            <small>Quick doorstep delivery</small>
          </div>
        </div>

        <div className="benefit-item">
          <span>🔒</span>
          <div>
            <strong>Secure Payments</strong>
            <small>Safe and protected checkout</small>
          </div>
        </div>

        <div className="benefit-item">
          <span>↩️</span>
          <div>
            <strong>Easy Returns</strong>
            <small>Simple return experience</small>
          </div>
        </div>

        <div className="benefit-item">
          <span>🏪</span>
          <div>
            <strong>Trusted Sellers</strong>
            <small>Multiple sellers marketplace</small>
          </div>
        </div>

        <div className="benefit-item">
          <span>💬</span>
          <div>
            <strong>Customer Support</strong>
            <small>We're here to help</small>
          </div>
        </div>
      </section>

      {/* ======================================================
          DEALS
      ====================================================== */}
      <section
        id="mega-deals"
        className="market-section dark-section"
      >
        <div className="section-heading light-heading">
          <div>
            <span>LIMITED TIME</span>
            <h2>🔥 Mega Deals</h2>
            <p>
              Prices you don't want to miss.
            </p>
          </div>

          <Link to="/products">
            View All Deals →
          </Link>
        </div>

        {dealProducts.length > 0 ? (
          <div className="mega-deal-grid">
            {dealProducts.map((product) => {
              const pct = discountPercent(
                product.deal.price,
                product.mrp
              );

              return (
                <Link
                  to={`/products/${product.id}`}
                  className="mega-deal-card"
                  key={product.id}
                  onClick={() =>
                    handleProductClick(product.id)
                  }
                >
                  <div className="mega-deal-image">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                    />

                    {pct > 0 && (
                      <span>{pct}% OFF</span>
                    )}
                  </div>

                  <div className="mega-deal-content">
                    <h3>{product.name}</h3>

                    <div>
                      <strong>
                        {formatINR(product.deal.price)}
                      </strong>

                      <del>
                        {formatINR(product.mrp)}
                      </del>
                    </div>

                    <DealCountdown
                      endsInMinutes={
                        product.deal.endsInMinutes
                      }
                      compact
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          renderHorizontalProducts(
            discountedProducts.slice(0, 8)
          )
        )}
      </section>

      {/* ======================================================
          SHOP BY CATEGORY
      ====================================================== */}
      <section className="market-section">

        <div className="section-heading">
          <div>
            <span>EXPLORE</span>
            <h2>Shop by Category</h2>
          </div>

          <Link to="/products">
            See All →
          </Link>
        </div>

        <div className="category-grid">

          {CATEGORIES.map((category, index) => {
            const count = getCategoryProducts(
              category.id
            ).length;

            return (
              <button
                key={category.id}
                className={`category-tile category-tile-${index % 6}`}
                onClick={() =>
                  browseCategory(category.id)
                }
              >
                <div className="category-icon">
                  {["🛒", "📱", "👕", "🏠", "💻", "🎧"][
                    index % 6
                  ]}
                </div>

                <strong>{category.label}</strong>

                <small>
                  {count} products
                </small>
              </button>
            );
          })}
        </div>
      </section>

      {/* ======================================================
          SPECIAL OFFER BANNERS
      ====================================================== */}
      <section className="offer-banner-grid">

        <div className="offer-banner offer-banner-one">
          <div>
            <small>WEEKEND SPECIAL</small>
            <h2>Save more on everyday essentials</h2>
            <p>Deals starting from ₹99</p>

            <button
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Shop Now →
            </button>
          </div>
        </div>

        <div className="offer-banner offer-banner-two">
          <div>
            <small>ELECTRONICS SALE</small>
            <h2>Upgrade your gadgets</h2>
            <p>Smart deals on technology</p>

            <button
              onClick={() =>
                browseCategory("electronics")
              }
            >
              Explore Electronics →
            </button>
          </div>
        </div>

        <div className="offer-banner offer-banner-three">
          <div>
            <small>FASHION PICKS</small>
            <h2>Fresh looks. Better prices.</h2>
            <p>New styles for every day</p>

            <button
              onClick={() =>
                browseCategory("fashion")
              }
            >
              Shop Fashion →
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================
          TOP DEALS
      ====================================================== */}
      <section className="market-section">

        <div className="section-heading">
          <div>
            <span>SHOP SMART</span>
            <h2>Top Deals For You</h2>
            <p>Hand-picked products with great prices.</p>
          </div>

          <Link to="/products">
            View More →
          </Link>
        </div>

        {renderHorizontalProducts(
          discountedProducts.slice(0, 10)
        )}
      </section>

      {/* ======================================================
          ELECTRONICS
      ====================================================== */}
      <section className="market-section category-section">

        <div className="category-section-heading">

          <div>
            <span>TECH ZONE</span>
            <h2>📱 Electronics Deals</h2>
            <p>
              Gadgets, accessories and everyday technology.
            </p>
          </div>

          <button
            onClick={() =>
              browseCategory("electronics")
            }
          >
            View Electronics →
          </button>
        </div>

        {renderHorizontalProducts(
          getCategoryProducts("electronics").slice(0, 10)
        )}
      </section>

      {/* ======================================================
          FASHION
      ====================================================== */}
      <section className="market-section fashion-section">

        <div className="category-section-heading">

          <div>
            <span>STYLE STORE</span>
            <h2>👕 Fashion Picks</h2>
            <p>
              Everyday fashion at marketplace prices.
            </p>
          </div>

          <button
            onClick={() =>
              browseCategory("fashion")
            }
          >
            Explore Fashion →
          </button>
        </div>

        {renderHorizontalProducts(
          getCategoryProducts("fashion").slice(0, 10)
        )}
      </section>

      {/* ======================================================
          HOME & LIVING
      ====================================================== */}
      <section className="market-section">

        <div className="category-section-heading">

          <div>
            <span>MAKE IT HOME</span>
            <h2>🏠 Home & Living</h2>
            <p>
              Useful products for every corner of your home.
            </p>
          </div>

          <button
            onClick={() =>
              browseCategory("home")
            }
          >
            Shop Home →
          </button>
        </div>

        {renderHorizontalProducts(
          getCategoryProducts("home").slice(0, 10)
        )}
      </section>

      {/* ======================================================
          BANK OFFERS
      ====================================================== */}
      <section className="market-section">

        <div className="section-heading">
          <div>
            <span>EXTRA SAVINGS</span>
            <h2>💳 Payment Offers</h2>
          </div>
        </div>

        <div className="payment-offer-grid">

          <div className="payment-card">
            <span>🏦</span>
            <div>
              <strong>Bank Offer</strong>
              <h3>10% Instant Discount</h3>
              <p>
                On selected bank cards.
              </p>
              <button
                onClick={() => copyCoupon("BSPBANK10")}
              >
                {couponCopied === "BSPBANK10"
                  ? "Copied!"
                  : "Copy BSPBANK10"}
              </button>
            </div>
          </div>

          <div className="payment-card">
            <span>💰</span>
            <div>
              <strong>New Customer</strong>
              <h3>₹200 OFF</h3>
              <p>
                Special welcome savings.
              </p>
              <button
                onClick={() => copyCoupon("WELCOME200")}
              >
                {couponCopied === "WELCOME200"
                  ? "Copied!"
                  : "Copy WELCOME200"}
              </button>
            </div>
          </div>

          <div className="payment-card">
            <span>🎁</span>
            <div>
              <strong>Festival Offer</strong>
              <h3>Extra 15% OFF</h3>
              <p>
                On selected products.
              </p>
              <button
                onClick={() => copyCoupon("FESTIVE15")}
              >
                {couponCopied === "FESTIVE15"
                  ? "Copied!"
                  : "Copy FESTIVE15"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          UNDER ₹499
      ====================================================== */}
      <section className="market-section price-section">

        <div className="section-heading">
          <div>
            <span>BUDGET PICKS</span>
            <h2>Everything Under ₹499</h2>
            <p>
              Great products without breaking the budget.
            </p>
          </div>

          <Link to="/products">
            View All →
          </Link>
        </div>

        {renderHorizontalProducts(
          lowPriceProducts
        )}
      </section>

      {/* ======================================================
          TOP RATED
      ====================================================== */}
      <section className="market-section">

        <div className="section-heading">
          <div>
            <span>CUSTOMER FAVOURITES</span>
            <h2>⭐ Top Rated Products</h2>
            <p>
              Products customers are loving.
            </p>
          </div>

          <Link to="/products">
            See More →
          </Link>
        </div>

        {renderHorizontalProducts(
          topRatedProducts.slice(0, 10)
        )}
      </section>

      {/* ======================================================
          NEW ARRIVALS
      ====================================================== */}
      <section className="market-section new-arrival-section">

        <div className="section-heading">
          <div>
            <span>JUST ARRIVED</span>
            <h2>✨ New Arrivals</h2>
            <p>
              Fresh products added to BSP CART.
            </p>
          </div>

          <Link to="/products">
            Explore New Arrivals →
          </Link>
        </div>

        {renderHorizontalProducts(
          newestProducts.slice(0, 10)
        )}
      </section>

      {/* ======================================================
          DEALS UNDER 999
      ====================================================== */}
      <section className="under-nine-section">

        <div>
          <span>PRICE DROP</span>
          <h2>Deals Under ₹999</h2>
          <p>
            Big value. Small price.
          </p>

          <button
            onClick={() =>
              document
                .getElementById("products")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Shop Under ₹999
          </button>
        </div>

        <div className="price-circle">
          ₹999
        </div>

        <div className="price-circle small-circle">
          ₹499
        </div>

        <div className="price-circle tiny-circle">
          ₹199
        </div>
      </section>

      {/* ======================================================
          FESTIVAL SPECIAL
      ====================================================== */}
      <section className="festival-section">

        <div className="festival-copy">
          <span>🎉 BSP CART FESTIVAL</span>

          <h2>
            Celebrate more.
            <br />
            Spend less.
          </h2>

          <p>
            Discover special prices across thousands
            of everyday products.
          </p>

          <button
            onClick={() =>
              document
                .getElementById("mega-deals")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Explore Festival Deals
          </button>
        </div>

        <div className="festival-discount">
          <strong>80%</strong>
          <span>OFF</span>
          <small>UP TO</small>
        </div>
      </section>

      {/* ======================================================
          BEST SELLERS
      ====================================================== */}
      <section className="market-section">

        <div className="section-heading">
          <div>
            <span>MOST POPULAR</span>
            <h2>🏆 Bestsellers</h2>
            <p>
              Popular products across BSP CART.
            </p>
          </div>
        </div>

        {renderHorizontalProducts(
          topRatedProducts.slice(0, 8)
        )}
      </section>

      {/* ======================================================
          SEARCH / PRODUCT GRID
      ====================================================== */}
      <section
        id="products"
        className="market-section product-explorer"
      >

        <div className="section-heading explorer-heading">

          <div>
            <span>ALL PRODUCTS</span>

            <h2>
              {query
                ? `Results for "${query}"`
                : activeCategory === "all"
                ? "Explore Our Products"
                : `${
                    CATEGORIES.find(
                      (c) =>
                        c.id === activeCategory
                    )?.label ||
                    "Products"
                  }`}
            </h2>

            <p>
              {filtered.length} products available
            </p>
          </div>

          <button
            onClick={() => {
              setQuery("");
              setActiveCategory("all");
            }}
          >
            Clear Filters
          </button>
        </div>

        <div className="categories">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={
                "category-pill" +
                (activeCategory === category.id
                  ? " active"
                  : "")
              }
              onClick={() =>
                setActiveCategory(category.id)
              }
            >
              {category.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div>🔎</div>

            <h3>
              No products found
            </h3>

            <p>
              Try another search term or category.
            </p>

            <button
              className="primary-btn"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="products">
            {filtered.map((product) =>
              renderProductCard(product)
            )}
          </div>
        )}
      </section>

      {/* ======================================================
          BUY IT AGAIN
      ====================================================== */}
      <section className="component-section">
        <BuyItAgain />
      </section>

      {/* ======================================================
          RECOMMENDED
      ====================================================== */}
      <section className="component-section">
        <RecommendedProducts />
      </section>

      {/* ======================================================
          SELLER CTA
      ====================================================== */}
      <section className="seller-cta">

        <div className="seller-icon">
          🏪
        </div>

        <div>
          <span>GROW YOUR BUSINESS</span>

          <h2>
            Become a BSP CART Seller
          </h2>

          <p>
            Reach more customers, list your products
            and grow your online business.
          </p>
        </div>

        <button
          onClick={() =>
            navigate("/register?role=SELLER")
          }
        >
          Start Selling →
        </button>
      </section>
    </div>
  );
}