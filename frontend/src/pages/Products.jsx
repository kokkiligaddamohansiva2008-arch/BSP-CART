import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read search from URL when page loads
  const urlSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("relevance");

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
      const matchesCategory =
        category === "all" ||
        String(product.category || "").toLowerCase() ===
          String(category || "").toLowerCase();

      if (!matchesCategory) {
        return false;
      }

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
          (a, b) => Number(a.price || 0) - Number(b.price || 0)
        );
        break;

      case "price-desc":
        list = [...list].sort(
          (a, b) => Number(b.price || 0) - Number(a.price || 0)
        );
        break;

      case "rating":
        list = [...list].sort(
          (a, b) =>
            Number(b.rating || 0) - Number(a.rating || 0)
        );
        break;

      case "newest":
        list = [...list].sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        );
        break;

      case "relevance":
      default:
        /*
         * Keep original catalog order for relevance.
         *
         * Since the catalog is currently local/static,
         * this is the safest default.
         */
        break;
    }

    return list;
  }, [search, category, sort]);

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
            className={`btn btn-sm ${
              category === c.id
                ? "btn-dark"
                : "btn-outline-dark"
            }`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
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

      {/* RESULT COUNT */}
      <div className="d-flex justify-content-between align-items-center mb-3">

        <span className="text-muted small">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "product"
            : "products"}{" "}
          found
        </span>

        {(search.trim() || category !== "all") && (
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