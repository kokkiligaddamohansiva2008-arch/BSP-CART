import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiGrid, FiShoppingBag, FiSmartphone, FiTag, FiHome, FiPackage, FiCoffee, FiFeather, FiDroplet, FiHeart, FiHeadphones, FiUser, FiSmile, FiBook, FiActivity, FiGitBranch, FiTool, FiTruck, FiGift } from "react-icons/fi";
import Swal from "sweetalert2";
import ProductCard from "../components/ProductCard";
import { CATEGORIES, PRODUCTS } from "../data/catalog";
import { addRecentlyViewed } from "../utils/bspStorage";
import { addToCart as addToStoredCart } from "../utils/cartStore";

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating", label: "Avg. Customer Rating" },
  { id: "newest", label: "Newest First" },
];

// Parent filters include their matching subcategories in the catalogue.
const CATEGORY_GROUPS = {
  grocery: ["grocery", "groceries-and-staples", "snacks-and-beverages", "dairy-and-bakery", "fruits-and-vegetables", "household-and-cleaning", "kitchen-and-dining", "personal-care"],
  electronics: ["electronics", "electronics-and-accessories"],
  fashion: ["fashion", "men-s-fashion", "women-s-fashion"],
  home: ["home", "home-decor-and-furnishing", "kitchen-and-dining"],
};

const categoryIcon = (category) => {
  const label = String(category.label || "").toLowerCase();
  const id = String(category.id || "").toLowerCase();
  if (id === "all") return FiGrid;
  if (id === "grocery" || label.includes("grocery")) return label.includes("staples") ? FiPackage : FiShoppingBag;
  if (label.includes("snack") || label.includes("dairy")) return FiCoffee;
  if (label.includes("fruit")) return FiFeather;
  if (label.includes("household")) return FiDroplet;
  if (label.includes("personal care") || label.includes("health")) return FiHeart;
  if (label.includes("electronic")) return label.includes("accessories") ? FiHeadphones : FiSmartphone;
  if (label.includes("fashion") || label.includes("clothing")) return label.includes("women") || label.includes("men") ? FiUser : FiTag;
  if (label.includes("kids") || label.includes("baby")) return FiSmile;
  if (label.includes("stationery") || label.includes("office")) return FiBook;
  if (label.includes("pet") || label.includes("garden")) return FiGitBranch;
  if (label.includes("tool") || label.includes("hardware")) return FiTool;
  if (label.includes("auto") || label.includes("travel")) return FiTruck;
  if (label.includes("gift") || label.includes("festival")) return FiGift;
  if (label.includes("home") || label.includes("kitchen") || label.includes("decor")) return FiHome;
  return FiTag;
};

// Convert numbers and formatted currency strings safely before comparing.
const numericValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const productDate = (product) => {
  const value = product.createdAt || product.created_at || product.createdOn || product.dateAdded;
  const timestamp = value ? Date.parse(value) : NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read search from URL when page loads
  const urlSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("relevance");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [inStockOnly, setInStockOnly] = useState(false);

  /*
   * Keep local search synchronized with the URL.
   *
   * Example:
   * /products?search=iphone
   */
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  /*
   * Update URL whenever the search text changes.
   *
   * This allows Navbar search and Products page search
   * to work together.
   */
  useEffect(() => {
    const trimmedSearch = search.trim();

    const currentUrlSearch = searchParams.get("search") || "";

    if (trimmedSearch === currentUrlSearch) {
      return;
    }

    const params = new URLSearchParams(searchParams);

    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    } else {
      params.delete("search");
    }

    setSearchParams(params, { replace: true });
  }, [search]);

  /*
   * Efficient product filtering.
   *
   * Searches through:
   * - Product name
   * - Category
   * - Description
   * - Seller
   * - Highlights
   *
   * Multiple words are supported.
   *
   * Example:
   * "wireless headphones"
   *
   * The product must match both:
   * "wireless"
   * AND
   * "headphones"
   */
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    // Convert search text into individual words
    const searchWords = normalizedSearch
      .split(/\s+/)
      .filter(Boolean);

    let list = PRODUCTS.filter((product) => {
      // Category filtering
      const selectedCategory = String(category || "").toLowerCase();
      const productCategory = String(product.category || "").toLowerCase();
      const includedCategories = CATEGORY_GROUPS[selectedCategory] || [selectedCategory];
      const matchesCategory =
        selectedCategory === "all" ||
        includedCategories.includes(productCategory);

      if (!matchesCategory) return false;
      const price = numericValue(product.price);
      if (minPrice !== "" && price < Number(minPrice)) return false;
      if (maxPrice !== "" && price > Number(maxPrice)) return false;
      if (Number(minRating) > 0 && numericValue(product.rating) < Number(minRating)) return false;
      if (inStockOnly && numericValue(product.stock) <= 0) return false;

      // No search entered
      if (searchWords.length === 0) {
        return true;
      }

      /*
       * Create one searchable string from all useful
       * product information.
       */
      const searchableText = [
        product.name,
        product.category,
        product.description,
        product.seller,
        product.brand,
        product.title,
        ...(Array.isArray(product.highlights)
          ? product.highlights
          : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      /*
       * Every search word must exist somewhere in the
       * product information.
       */
      return searchWords.every((word) =>
        searchableText.includes(word)
      );
    });

    // Sorting
    switch (sort) {
      case "price-asc":
        list = [...list].sort(
          (a, b) => numericValue(a.price) - numericValue(b.price)
        );
        break;

      case "price-desc":
        list = [...list].sort(
          (a, b) => numericValue(b.price) - numericValue(a.price)
        );
        break;

      case "rating":
        list = [...list].sort(
          (a, b) => numericValue(b.rating) - numericValue(a.rating)
        );
        break;

      case "newest":
        list = [...list].sort((a, b) => {
          const dateA = productDate(a);
          const dateB = productDate(b);

          // Prefer the actual creation timestamp; use ID only when dates
          // are unavailable (for older sample/catalogue records).
          if (dateA !== null && dateB !== null) return dateB - dateA;
          if (dateA !== null) return -1;
          if (dateB !== null) return 1;
          return numericValue(b.id) - numericValue(a.id);
        });
        break;

      case "relevance":
      default:
        if (normalizedSearch) {
          list = [...list].sort((a, b) => {
            const score = (p) => {
              const title = String(p.name || "").toLowerCase();
              return title === normalizedSearch ? 3 : title.startsWith(normalizedSearch) ? 2 : title.includes(normalizedSearch) ? 1 : 0;
            };
            return score(b) - score(a);
          });
        }
        break;
    }

    return list;
  }, [search, category, sort, minPrice, maxPrice, minRating, inStockOnly]);

  /*
   * Add product to cart.
   */
  const addToCart = (productId) => {
    const result = addToStoredCart(productId, 1);

    Swal.fire({
      icon: result.ok ? "success" : "warning",
      title: result.ok ? "Added to cart" : "Can't add this item",
      text: result.ok ? `${result.product.name} added to your cart` : "This product is out of stock.",
      timer: 1400,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  };

  /*
   * Clear search only.
   */
  const clearSearch = () => {
    setSearch("");

    const params = new URLSearchParams(searchParams);
    params.delete("search");

    setSearchParams(params, { replace: true });
  };

  /*
   * Clear search + category filters.
   */
  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setSort("relevance");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("0");
    setInStockOnly(false);

    setSearchParams({}, { replace: true });
  };

  /*
   * Handle search input.
   */
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  /*
   * Allow pressing Enter without submitting a form.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const trimmedSearch = search.trim();

    setSearch(trimmedSearch);

    const params = new URLSearchParams(searchParams);

    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    } else {
      params.delete("search");
    }

    setSearchParams(params, { replace: true });
  };

  return (
    <div className="container py-4">

      {/* PAGE HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">

        <div>
          <h2 className="mb-1">Products</h2>

          {search.trim() && (
            <div className="text-muted small">
              Search results for{" "}
              <strong>"{search.trim()}"</strong>
            </div>
          )}
        </div>

        {/* SEARCH BOX */}
        <form
          onSubmit={handleSearchSubmit}
          className="d-flex"
          style={{ maxWidth: 400, width: "100%" }}
        >
          <div className="input-group">

            <input id="plp-product-search" name="product-search"
              type="search"
              className="form-control"
              placeholder="Search products..."
              value={search}
              onChange={handleSearchChange}
              aria-label="Search products"
            />

            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearSearch}
                title="Clear search"
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            <button
              type="submit"
              className="btn btn-dark"
              aria-label="Search"
            >
              Search
            </button>

          </div>
        </form>
      </div>

      {/* FILTERS */}
      <div className="d-flex flex-wrap gap-2 mb-4">

        {/* CATEGORY BUTTONS */}
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`btn btn-sm d-inline-flex align-items-center gap-2 ${
              category === c.id
                ? "btn-dark"
                : "btn-outline-dark"
            }`}
            onClick={() => setCategory(c.id)}
            aria-pressed={category === c.id}
          >
            {(() => {
              const Icon = categoryIcon(c);
              return <Icon aria-hidden="true" size={16} strokeWidth={2.1} />;
            })()}
            <span>{c.label}</span>
          </button>
        ))}

        {/* SORT */}
        <select id="plp-sort-by" name="sort-by"
          className="form-select form-select-sm ms-auto"
          style={{ maxWidth: 220 }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((opt) => (
            <option
              key={opt.id}
              value={opt.id}
            >
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="row g-2 align-items-end mb-3" aria-label="Advanced product filters">
        <div className="col-6 col-lg-2">
          <label className="form-label small" htmlFor="plp-min-price">Minimum price (₹)</label>
          <input id="plp-min-price" className="form-control form-control-sm" type="number" min="0" inputMode="numeric"
            value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
        </div>
        <div className="col-6 col-lg-2">
          <label className="form-label small" htmlFor="plp-max-price">Maximum price (₹)</label>
          <input id="plp-max-price" className="form-control form-control-sm" type="number" min="0" inputMode="numeric"
            value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" />
        </div>
        <div className="col-6 col-lg-2">
          <label className="form-label small" htmlFor="plp-min-rating">Minimum rating</label>
          <select id="plp-min-rating" className="form-select form-select-sm" value={minRating}
            onChange={(e) => setMinRating(e.target.value)}>
            <option value="0">Any rating</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
        </div>
        <div className="col-6 col-lg-3">
          <div className="form-check mb-2">
            <input id="plp-in-stock" className="form-check-input" type="checkbox"
              checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
            <label htmlFor="plp-in-stock" className="form-check-label">Only in-stock products</label>
          </div>
        </div>
      </div>

      {/* RESULT COUNT */}
      <div className="d-flex justify-content-between align-items-center mb-3">

        <span className="text-muted small">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "product"
            : "products"}{" "}
          found
        </span>

        {(search.trim() || category !== "all" || sort !== "relevance" || minPrice !== "" || maxPrice !== "" || minRating !== "0" || inStockOnly) && (
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none"
            onClick={clearFilters}
          >
            Clear all filters
          </button>
        )}

      </div>

      {/* PRODUCTS */}
      {filtered.length === 0 ? (
        <div className="text-center text-muted py-5">

          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
            }}
          >
            🔍
          </div>

          <h5>No products found</h5>

          <p className="mb-3">
            {search.trim()
              ? `No products match "${search.trim()}".`
              : "No products match the selected filters."}
          </p>

          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={clearFilters}
          >
            Clear filters
          </button>

        </div>
      ) : (
        <div className="row g-3">

          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              onView={() =>
                addRecentlyViewed(product.id)
              }
            />
          ))}

        </div>
      )}

    </div>
  );
};

export default Products;