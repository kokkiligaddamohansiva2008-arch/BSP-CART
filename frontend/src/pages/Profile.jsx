import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { FaBoxOpen, FaHeart, FaEye, FaTrashAlt } from "react-icons/fa";
import { getSellerProducts, deleteSellerProduct, formatINR } from "../data/catalog";
import { getWishlist, getRecentlyViewed } from "../utils/bspStorage";
import "./Profile.css";

const ROLE_LABELS = {
  SELLER: "Seller",
  BUYER: "Buyer",
  ADMIN: "Administrator",
};

function Profile() {
  const name = localStorage.getItem("name") || "Guest";
  const username = localStorage.getItem("username") || localStorage.getItem("userId") || "—";
  const role = localStorage.getItem("role") || "BUYER";

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [products, setProducts] = useState([]);

  const loadProducts = () => {
    if (role === "SELLER") {
      setProducts(getSellerProducts(username));
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, username]);

  const wishlistCount = useMemo(() => getWishlist().length, []);
  const recentlyViewedCount = useMemo(() => getRecentlyViewed().length, []);

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
      {/* Account hero */}
      <div className="pf-hero">
        <div className="pf-avatar">{initials || "U"}</div>

        <div className="pf-hero-info">
          <h2>{name}</h2>
          <p>@{username}</p>
          <span className="pf-role-badge">{ROLE_LABELS[role] || role}</span>
        </div>
      </div>

      {/* Account details */}
      <div className="pf-details-grid">
        <div className="pf-detail-card">
          <h6>Full Name</h6>
          <p>{name}</p>
        </div>

        <div className="pf-detail-card">
          <h6>Username</h6>
          <p>{username}</p>
        </div>

        <div className="pf-detail-card">
          <h6>Account Type</h6>
          <p>{ROLE_LABELS[role] || role}</p>
        </div>

        {role === "SELLER" && (
          <div className="pf-detail-card">
            <h6>Products Listed</h6>
            <p>{products.length}</p>
          </div>
        )}

        {role === "BUYER" && (
          <>
            <div className="pf-detail-card">
              <h6>Wishlist Items</h6>
              <p>{wishlistCount}</p>
            </div>
            <div className="pf-detail-card">
              <h6>Recently Viewed</h6>
              <p>{recentlyViewedCount}</p>
            </div>
          </>
        )}
      </div>

      {/* Role-specific sections */}
      {role === "SELLER" && (
        <>
          <div className="pf-section-header">
            <h3>My Uploaded Products</h3>
            <Link to="/seller/dashboard" className="btn btn-primary btn-sm">
              + Add / Manage Products
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="pf-empty-state">
              <FaBoxOpen className="mb-2" style={{ fontSize: 32 }} />
              <p className="mb-2">You haven't uploaded any products yet.</p>
              <Link to="/seller/dashboard" className="btn btn-outline-primary btn-sm">
                Add your first product
              </Link>
            </div>
          ) : (
            <div className="pf-product-grid">
              {products.map((product) => (
                <div className="pf-product-card" key={product.id}>
                  <div className="pf-product-thumb">
                    <img src={product.image} alt={product.name} />
                  </div>

                  <div className="pf-product-body">
                    <h5 title={product.name}>{product.name}</h5>

                    <div className="pf-product-meta">
                      <span className="price">{formatINR(product.price)}</span>
                      <span className="stock">{product.stock} in stock</span>
                    </div>

                    <div className="pf-product-actions">
                      <Link to="/seller/dashboard" className="manage-btn">
                        Edit
                      </Link>
                      <button className="delete-btn" onClick={() => deleteProduct(product)}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {role === "BUYER" && (
        <div className="pf-section-header">
          <h3>Quick Links</h3>
        </div>
      )}
      {role === "BUYER" && (
        <div className="pf-details-grid">
          <Link to="/orders" className="pf-detail-card text-decoration-none">
            <h6>
              <FaEye className="me-1" /> Orders
            </h6>
            <p>View your order history</p>
          </Link>
          <Link to="/cart" className="pf-detail-card text-decoration-none">
            <h6>
              <FaHeart className="me-1" /> Cart & Wishlist
            </h6>
            <p>Review saved items</p>
          </Link>
        </div>
      )}

      {role === "ADMIN" && (
        <div className="pf-section-header">
          <h3>Administration</h3>
          <Link to="/admin/dashboard" className="btn btn-primary btn-sm">
            Go to Admin Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

export default Profile;
