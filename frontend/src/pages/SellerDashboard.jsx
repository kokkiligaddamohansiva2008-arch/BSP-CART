import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  FaBoxOpen,
  FaShoppingBag,
  FaWarehouse,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaStore,
  FaImages,
  FaInbox,
  FaLayerGroup,
} from "react-icons/fa";
import Modal from "../components/common/Modal";
import {
  CATEGORIES,
  getSellerProducts,
  addSellerProduct,
  addSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
  formatINR,
} from "../data/catalog";
import "./SellerDashboard.css";

const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c.id !== "all");

const EMPTY_FORM = {
  name: "",
  category: PRODUCT_CATEGORIES[0]?.id || "grocery",
  price: "",
  mrp: "",
  stock: "",
  description: "",
};

const MAX_GALLERY_IMAGES = 4;
const BULK_START_ROWS = 3;
const BULK_MAX_ROWS = 20;

let rowCounter = 0;
const newRow = () => ({ key: `row-${++rowCounter}`, ...EMPTY_FORM, images: [] });

const isRowEmpty = (r) =>
  !r.name.trim() && r.price === "" && r.stock === "" && !r.description.trim() && r.images.length === 0;

// NOTE: never pass fileToDataUrl straight to Array.map — map also passes
// (index, array) which would land in the maxDim / quality parameters and
// shrink every picture to 0-1px (blank image). Always wrap it.
const filesToDataUrls = (files) => Promise.all(files.map((file) => fileToDataUrl(file)));
const LOW_STOCK_THRESHOLD = 5;

// Read a File, downscale it, and return a compressed base64 data URL so it
// can be stored (and previewed) entirely on the client, with no backend/file
// server involved. Full-size phone photos (often 3-8MB each) blow through
// localStorage's ~5MB quota after just one or two products, which is why
// uploads used to silently stop working after the first product — resizing
// to a reasonable max dimension and re-encoding as JPEG shrinks that to a
// few hundred KB per image.
function fileToDataUrl(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = () => reject(new Error("Could not read image"));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]); // array of data URLs
  const [saving, setSaving] = useState(false);

  // Bulk upload
  const [showBulk, setShowBulk] = useState(false);
  const [rows, setRows] = useState([]);

  const sellerUsername = localStorage.getItem("username") || localStorage.getItem("userId");
  const sellerName = localStorage.getItem("name") || "You";
  const initials = sellerName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const loadProducts = () => {
    setProducts(getSellerProducts(sellerUsername));
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.stock, 0),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImages([]);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      category: product.category || PRODUCT_CATEGORIES[0]?.id,
      price: product.price ?? "",
      mrp: product.mrp ?? "",
      stock: product.stock ?? "",
      description: product.description || "",
    });
    setImages(product.images && product.images.length ? product.images : [product.image].filter(Boolean));
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-picking the same file later

    const room = MAX_GALLERY_IMAGES - images.length;
    if (room <= 0 || files.length === 0) return;

    try {
      const dataUrls = await filesToDataUrls(files.slice(0, room));
      setImages((prev) => [...prev, ...dataUrls].slice(0, MAX_GALLERY_IMAGES));
    } catch (err) {
      Swal.fire("Image error", err.message || "Could not read that image.", "error");
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e, addAnother = false) => {
    e.preventDefault();

    if (!form.name.trim() || !form.price || form.stock === "") {
      Swal.fire("Missing details", "Name, price and stock are required.", "warning");
      return;
    }

    if (Number(form.price) <= 0 || Number(form.stock) < 0) {
      Swal.fire("Invalid values", "Price must be positive and stock cannot be negative.", "warning");
      return;
    }

    setSaving(true);

    const payload = { ...form, images };

    try {
      if (editingId) {
        updateSellerProduct(editingId, payload);
        Swal.fire({ icon: "success", title: "Updated", text: "Product updated successfully." });
      } else {
        addSellerProduct(sellerUsername, sellerName, payload);
        Swal.fire({ icon: "success", title: "Added", text: "Product added successfully." });
      }

      loadProducts();

      if (addAnother && !editingId) {
        // Reset the form for the next product but keep the modal open.
        setForm(EMPTY_FORM);
        setImages([]);
      } else {
        setShowModal(false);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Couldn't save product",
        text: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ Bulk upload ------------------------------ */

  const openBulkModal = () => {
    setRows(Array.from({ length: BULK_START_ROWS }, newRow));
    setShowBulk(true);
  };

  const closeBulkModal = () => setShowBulk(false);

  const addRow = () => {
    if (rows.length >= BULK_MAX_ROWS) {
      Swal.fire("Limit reached", `You can add up to ${BULK_MAX_ROWS} products at a time.`, "info");
      return;
    }
    setRows((prev) => [...prev, newRow()]);
  };

  const removeRow = (key) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const updateRow = (key, field, value) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const pickRowImages = async (key, e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    const row = rows.find((r) => r.key === key);
    const room = MAX_GALLERY_IMAGES - (row ? row.images.length : 0);
    if (room <= 0 || files.length === 0) return;

    try {
      const dataUrls = await filesToDataUrls(files.slice(0, room));
      setRows((prev) =>
        prev.map((r) =>
          r.key === key
            ? { ...r, images: [...r.images, ...dataUrls].slice(0, MAX_GALLERY_IMAGES) }
            : r
        )
      );
    } catch (err) {
      Swal.fire("Image error", err.message || "Could not read that image.", "error");
    }
  };

  const removeRowImage = (key, index) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, images: r.images.filter((_, i) => i !== index) } : r))
    );
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();

    // Ignore rows the seller never touched.
    const filled = rows
      .map((r, i) => ({ row: r, number: i + 1 }))
      .filter(({ row }) => !isRowEmpty(row));

    if (filled.length === 0) {
      Swal.fire("Nothing to save", "Fill in at least one product.", "warning");
      return;
    }

    for (const { row, number } of filled) {
      if (!row.name.trim() || !row.price || row.stock === "") {
        Swal.fire("Missing details", `Product ${number}: name, price and stock are required.`, "warning");
        return;
      }
      if (Number(row.price) <= 0 || Number(row.stock) < 0) {
        Swal.fire(
          "Invalid values",
          `Product ${number}: price must be positive and stock cannot be negative.`,
          "warning"
        );
        return;
      }
    }

    setSaving(true);

    try {
      const created = addSellerProducts(
        sellerUsername,
        sellerName,
        filled.map(({ row }) => ({ ...row, name: row.name.trim() }))
      );

      loadProducts();
      setShowBulk(false);

      Swal.fire({
        icon: "success",
        title: "Products added",
        text: `${created.length} product${created.length > 1 ? "s" : ""} added successfully.`,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Couldn't save products",
        text: err.message || "Something went wrong. Nothing was saved, please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = (product) => {
    Swal.fire({
      icon: "warning",
      title: "Delete this product?",
      text: `"${product.name}" will be removed from your listings.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc3545",
    }).then((result) => {
      if (!result.isConfirmed) return;

      deleteSellerProduct(product.id);
      loadProducts();

      Swal.fire({ icon: "success", title: "Deleted", text: "Product deleted successfully." });
    });
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Hero header */}
      <div className="sd-hero">
        <div className="sd-hero-left">
          <div className="sd-hero-avatar">
            <FaStore />
          </div>
          <div>
            <h2>{sellerName}'s Store</h2>
            <p>Manage your product listings, stock and images</p>
          </div>
        </div>

        <div className="sd-hero-actions">
          <button className="sd-add-btn" onClick={openAddModal}>
            <FaPlus /> Add Product
          </button>

          <button className="sd-add-btn sd-bulk-btn" onClick={openBulkModal}>
            <FaLayerGroup /> Bulk Upload
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="sd-stats-grid">
        <div className="sd-stat-card">
          <div className="sd-stat-icon products">
            <FaBoxOpen />
          </div>
          <div className="sd-stat-info">
            <h5>Total Products</h5>
            <h2>{products.length}</h2>
          </div>
        </div>

        <div className="sd-stat-card">
          <div className="sd-stat-icon orders">
            <FaShoppingBag />
          </div>
          <div className="sd-stat-info">
            <h5>Total Orders</h5>
            <h2>15</h2>
          </div>
        </div>

        <div className="sd-stat-card">
          <div className="sd-stat-icon inventory">
            <FaWarehouse />
          </div>
          <div className="sd-stat-info">
            <h5>Inventory Value</h5>
            <h2>{formatINR(inventoryValue)}</h2>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sd-toolbar">
        <h3>My Products</h3>

        <div className="sd-toolbar-actions">
          <button type="button" className="btn btn-primary sd-toolbar-btn" onClick={openAddModal}>
            <FaPlus /> Add Product
          </button>

          <button type="button" className="btn btn-outline-primary sd-toolbar-btn" onClick={openBulkModal}>
            <FaLayerGroup /> Bulk Upload
          </button>
        </div>

        <div className="sd-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search your products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Product grid */}
      {filteredProducts.length === 0 ? (
        <div className="sd-empty-state">
          <div className="sd-empty-icon">
            <FaInbox />
          </div>
          <p className="mb-0">
            {products.length === 0
              ? "You haven't added any products yet."
              : `No products match "${search}".`}
          </p>
          {products.length === 0 && (
            <button className="btn btn-primary mt-3" onClick={openAddModal}>
              <FaPlus className="me-1" /> Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="sd-product-grid">
          {filteredProducts.map((product) => (
            <div className="sd-product-card" key={product.id}>
              <div className="sd-product-thumb">
                <img src={product.image} alt={product.name} />
                <span className="sd-category-badge">{product.category}</span>
                <span
                  className={`sd-stock-badge ${product.stock <= LOW_STOCK_THRESHOLD ? "low" : "ok"}`}
                >
                  {product.stock <= LOW_STOCK_THRESHOLD ? "Low stock" : `${product.stock} in stock`}
                </span>
              </div>

              <div className="sd-product-body">
                <h4 title={product.name}>{product.name}</h4>

                <div className="sd-price-row">
                  <span className="price">{formatINR(product.price)}</span>
                  {product.mrp > product.price && (
                    <span className="mrp">{formatINR(product.mrp)}</span>
                  )}
                </div>

                <div className="sd-card-actions">
                  <button className="edit-btn" onClick={() => openEditModal(product)}>
                    <FaEdit /> Edit
                  </button>
                  <button className="delete-btn" onClick={() => deleteProduct(product)}>
                    <FaTrashAlt /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingId ? "Edit Product" : "Add Product"}
        show={showModal}
        onClose={closeModal}
      >
        <form className="sd-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Stock</label>
              <input
                type="number"
                min="0"
                className="form-control"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                min="1"
                className="form-control"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">MRP (₹, optional)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                name="mrp"
                value={form.mrp}
                onChange={handleChange}
                placeholder="Same as price if left blank"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Product Images ({images.length}/{MAX_GALLERY_IMAGES})
            </label>

            <div className={`sd-image-dropzone ${images.length >= MAX_GALLERY_IMAGES ? "disabled" : ""}`}>
              <FaImages className="mb-1" style={{ fontSize: 20 }} />
              <div>Click or drop images here</div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagePick}
                disabled={images.length >= MAX_GALLERY_IMAGES}
              />
            </div>

            {images.length > 0 && (
              <div className="sd-image-previews">
                {images.map((src, idx) => (
                  <div className="sd-image-preview" key={idx}>
                    <img src={src} alt={`preview ${idx + 1}`} />
                    <button type="button" onClick={() => removeImage(idx)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <small className="text-muted d-block mt-2">
              First image is used as the main product photo. Up to {MAX_GALLERY_IMAGES} images.
            </small>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>

            {!editingId && (
              <button
                type="button"
                className="btn btn-outline-success"
                disabled={saving}
                onClick={(e) => handleSubmit(e, true)}
              >
                Save & Add Another
              </button>
            )}

            <button type="submit" className="btn btn-success" disabled={saving}>
              {editingId ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal title="Bulk Upload Products" show={showBulk} onClose={closeBulkModal} size="lg">
        <form className="sd-form" onSubmit={handleBulkSubmit}>
          <p className="text-muted small mb-3">
            Add several products at once (up to {BULK_MAX_ROWS}). Empty rows are ignored.
          </p>

          <div className="sd-bulk-list">
            {rows.map((row, idx) => (
              <div className="sd-bulk-row" key={row.key}>
                <div className="sd-bulk-row-head">
                  <strong>Product {idx + 1}</strong>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="sd-bulk-remove"
                      onClick={() => removeRow(row.key)}
                      title="Remove this product"
                    >
                      <FaTrashAlt />
                    </button>
                  )}
                </div>

                <div className="sd-bulk-grid">
                  <input
                    type="text"
                    className="form-control sd-bulk-name"
                    placeholder="Product name"
                    value={row.name}
                    onChange={(e) => updateRow(row.key, "name", e.target.value)}
                  />

                  <select
                    className="form-select"
                    value={row.category}
                    onChange={(e) => updateRow(row.key, "category", e.target.value)}
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="Price ₹"
                    value={row.price}
                    onChange={(e) => updateRow(row.key, "price", e.target.value)}
                  />

                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="MRP ₹"
                    value={row.mrp}
                    onChange={(e) => updateRow(row.key, "mrp", e.target.value)}
                  />

                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="Stock"
                    value={row.stock}
                    onChange={(e) => updateRow(row.key, "stock", e.target.value)}
                  />
                </div>

                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Short description (optional)"
                  value={row.description}
                  onChange={(e) => updateRow(row.key, "description", e.target.value)}
                />

                <div className="sd-bulk-images">
                  <label
                    className={`sd-bulk-pick ${row.images.length >= MAX_GALLERY_IMAGES ? "disabled" : ""}`}
                  >
                    <FaImages /> Add images ({row.images.length}/{MAX_GALLERY_IMAGES})
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={row.images.length >= MAX_GALLERY_IMAGES}
                      onChange={(e) => pickRowImages(row.key, e)}
                    />
                  </label>

                  {row.images.map((src, i) => (
                    <div className="sd-image-preview" key={i}>
                      <img src={src} alt={`product ${idx + 1} preview ${i + 1}`} />
                      <button type="button" onClick={() => removeRowImage(row.key, i)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn btn-outline-primary btn-sm mt-3" onClick={addRow}>
            <FaPlus className="me-1" /> Add another product
          </button>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeBulkModal}>
              Cancel
            </button>

            <button type="submit" className="btn btn-success" disabled={saving}>
              Save All Products
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SellerDashboard;
