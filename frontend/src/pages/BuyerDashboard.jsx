import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaHeart,
  FaMapMarkerAlt,
  FaCreditCard,
  FaStar,
  FaBell,
  FaUserCircle,
  FaSearch,
  FaTrash,
  FaCheckCircle,
  FaPlus,
  FaShoppingBag,
  FaShoppingCart,
  FaWallet,
  FaRupeeSign,
  FaClipboardList,
  FaInbox,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { getMyOrders, cancelOrder } from "../services/orderService";
import { getProfile } from "../services/userService";
import { getProductById } from "../data/catalog";
import { getWishlist, toggleWishlist } from "../utils/bspStorage";
import Modal from "../components/common/Modal";
import "./BuyerDashboard.css";

const STATUS_CLASS = {
  pending: "bd-status-pending",
  processing: "bd-status-pending",
  shipped: "bd-status-shipped",
  delivered: "bd-status-delivered",
  cancelled: "bd-status-cancelled",
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "B";

const BuyerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);

  // ---------------- Wishlist ----------------
  // Wishlist only stores product IDs (see utils/bspStorage.js); hydrate
  // each ID against the shared catalog so name, price, and image always
  // match the real product instead of using disconnected placeholder data.
  const [wishlist, setWishlist] = useState([]);

  const loadWishlist = () => {
    const items = getWishlist()
      .map((productId) => getProductById(productId))
      .filter(Boolean); // drop any ID whose product no longer exists

    setWishlist(items);
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const removeFromWishlist = (id) => {
    toggleWishlist(id);
    loadWishlist();
  };

  const addWishlistItemToCart = (item) => {
    Swal.fire(
      "Added to Cart",
      `${item.name} added to your cart.`,
      "success"
    );
  };

  // ---------------- Addresses ----------------
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: "Home",
      line: "12-34, Main Road, Karimnagar, Telangana - 505001",
      isDefault: true,
    },
  ]);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [addressForm, setAddressForm] = useState({
    label: "",
    line: "",
  });

  const openAddAddress = () => {
    setEditingAddressId(null);

    setAddressForm({
      label: "",
      line: "",
    });

    setShowAddressModal(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddressId(addr.id);

    setAddressForm({
      label: addr.label,
      line: addr.line,
    });

    setShowAddressModal(true);
  };

  const saveAddress = () => {
    if (!addressForm.label.trim() || !addressForm.line.trim()) {
      Swal.fire(
        "Missing info",
        "Please fill in both fields.",
        "warning"
      );
      return;
    }

    if (editingAddressId) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingAddressId
            ? {
                ...a,
                label: addressForm.label.trim(),
                line: addressForm.line.trim(),
              }
            : a
        )
      );
    } else {
      setAddresses((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: addressForm.label.trim(),
          line: addressForm.line.trim(),
          isDefault: prev.length === 0,
        },
      ]);
    }

    setShowAddressModal(false);
  };

  const deleteAddress = async (id) => {
    const result = await Swal.fire({
      title: "Delete this address?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#EF4444",
    });

    if (result.isConfirmed) {
      setAddresses((prev) =>
        prev.filter((a) => a.id !== id)
      );
    }
  };

  const setDefaultAddress = (id) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  // ---------------- Payments ----------------
  const [payments, setPayments] = useState([
    {
      id: 1,
      method: "UPI",
      detail: "user@okhdfcbank",
      isDefault: true,
    },
  ]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    method: "UPI",
    detail: "",
  });

  const openAddPayment = () => {
    setEditingPaymentId(null);

    setPaymentForm({
      method: "UPI",
      detail: "",
    });

    setShowPaymentModal(true);
  };

  const openEditPayment = (pay) => {
    setEditingPaymentId(pay.id);

    setPaymentForm({
      method: pay.method,
      detail: pay.detail,
    });

    setShowPaymentModal(true);
  };

  const savePayment = () => {
    if (!paymentForm.detail.trim()) {
      Swal.fire(
        "Missing info",
        "Please enter the payment details.",
        "warning"
      );
      return;
    }

    if (editingPaymentId) {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === editingPaymentId
            ? {
                ...p,
                method: paymentForm.method,
                detail: paymentForm.detail.trim(),
              }
            : p
        )
      );
    } else {
      setPayments((prev) => [
        ...prev,
        {
          id: Date.now(),
          method: paymentForm.method,
          detail: paymentForm.detail.trim(),
          isDefault: prev.length === 0,
        },
      ]);
    }

    setShowPaymentModal(false);
  };

  const deletePayment = async (id) => {
    const result = await Swal.fire({
      title: "Remove this payment method?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#EF4444",
    });

    if (result.isConfirmed) {
      setPayments((prev) =>
        prev.filter((p) => p.id !== id)
      );
    }
  };

  const setDefaultPayment = (id) => {
    setPayments((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.id === id,
      }))
    );
  };

  // ---------------- Reviews ----------------
  const [reviews, setReviews] = useState([
    {
      id: 1,
      product: "Gaming Headset",
      rating: 4,
      comment: "Good sound quality.",
    },
  ]);

  const [showReviewModal, setShowReviewModal] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    product: "",
    rating: 5,
    comment: "",
  });

  const openAddReview = () => {
    setReviewForm({
      product: "",
      rating: 5,
      comment: "",
    });

    setShowReviewModal(true);
  };

  const saveReview = () => {
    if (
      !reviewForm.product.trim() ||
      !reviewForm.comment.trim()
    ) {
      Swal.fire(
        "Missing info",
        "Please fill in the product and comment.",
        "warning"
      );
      return;
    }

    setReviews((prev) => [
      {
        id: Date.now(),
        ...reviewForm,
        product: reviewForm.product.trim(),
      },
      ...prev,
    ]);

    setShowReviewModal(false);
  };

  // ---------------- Notifications ----------------
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "Your order #1002 has been shipped.",
      time: "2h ago",
      read: false,
    },
    {
      id: 2,
      message: "New offer: 20% off on electronics.",
      time: "1d ago",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, read: true }
          : n
      )
    );
  };

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
      }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ---------------- Profile ----------------
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const saveProfile = () => {
    localStorage.setItem(
      "name",
      profileForm.name || "Buyer"
    );

    setProfile((prev) => ({
      ...prev,
      ...profileForm,
    }));

    Swal.fire({
      icon: "success",
      title: "Profile Updated",
      text: "Your changes have been saved.",
      timer: 1600,
      showConfirmButton: false,
    });
  };

  // ---------------- Orders search/filter ----------------
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !orderSearch ||
        String(o.id).includes(orderSearch) ||
        (o.productName || "")
          .toLowerCase()
          .includes(orderSearch.toLowerCase());

      const normalizedStatus = (
        o.status || ""
      ).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, statusFilter]);

  // ---------------- Load data ----------------
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [orderData, profileData] =
        await Promise.allSettled([
          getMyOrders(),
          getProfile(),
        ]);

      setOrders(
        orderData.status === "fulfilled"
          ? orderData.value
          : []
      );

      setProfile(
        profileData.status === "fulfilled"
          ? profileData.value
          : {
              name:
                localStorage.getItem("name") ||
                "Buyer",
              role:
                localStorage.getItem("role") ||
                "BUYER",
            }
      );
    } catch (error) {
      console.error(
        "Failed to load dashboard data",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Cancel Order ----------------
  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: `Cancel order #${orderId}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      confirmButtonColor: "#EF4444",
    });

    if (!result.isConfirmed) return;

    try {
      await cancelOrder(orderId);

      Swal.fire({
        icon: "success",
        title: "Order Cancelled",
        text: `Order #${orderId} has been cancelled.`,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "cancelled",
              }
            : o
        )
      );
    } catch (error) {
      console.error(
        "Failed to cancel order:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text:
          "Could not cancel this order. Please try again.",
      });
    }
  };

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (o) =>
      (o.status || "").toLowerCase() ===
      "pending"
  ).length;

  const totalSpent = orders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );

  const TABS = [
    {
      key: "overview",
      label: "Overview",
      icon: <FaUserCircle />,
    },
    {
      key: "orders",
      label: "Orders",
      icon: <FaBoxOpen />,
    },
    {
      key: "wishlist",
      label: "Wishlist",
      icon: <FaHeart />,
      badge: wishlist.length,
    },
    {
      key: "addresses",
      label: "Addresses",
      icon: <FaMapMarkerAlt />,
    },
    {
      key: "payments",
      label: "Payments",
      icon: <FaCreditCard />,
    },
    {
      key: "reviews",
      label: "Reviews",
      icon: <FaStar />,
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: <FaBell />,
      badge: unreadCount,
    },
    {
      key: "profile",
      label: "Profile",
      icon: <FaUserCircle />,
    },
  ];

  const statusBadge = (status) => {
    const key = (status || "").toLowerCase();

    return (
      <span
        className={`bd-status ${
          STATUS_CLASS[key] ||
          "bd-status-default"
        }`}
      >
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <div className="container mt-4 mb-5">

      {/* Hero */}
      <div className="bd-hero mb-4">
        <div className="bd-hero-left">
          <div className="bd-avatar">
            {getInitials(profile?.name)}
          </div>

          <div>
            <h2>
              Welcome back
              {profile?.name
                ? `, ${profile.name}`
                : ""}
              !
            </h2>

            <span className="bd-role-badge">
              {profile?.role || "BUYER"}
            </span>
          </div>
        </div>

        <div className="bd-hero-actions">
          <Link
            to="/products"
            className="btn btn-light"
          >
            <FaShoppingBag className="me-2" />
            Browse Products
          </Link>

          <Link
            to="/cart"
            className="btn btn-outline-light"
          >
            <FaShoppingCart className="me-2" />
            View Cart
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-4 g-3">

        <div className="col-6 col-md-3">
          <div className="card bd-stat-card h-100">
            <div className="card-body d-flex align-items-center gap-3">

              <div
                className="bd-stat-icon"
                style={{
                  background: "#202a44",
                }}
              >
                <FaClipboardList />
              </div>

              <div>
                <p className="bd-stat-value">
                  {totalOrders}
                </p>

                <p className="bd-stat-label">
                  Total Orders
                </p>
              </div>

            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card bd-stat-card h-100">
            <div className="card-body d-flex align-items-center gap-3">

              <div
                className="bd-stat-icon"
                style={{
                  background: "#F59E0B",
                }}
              >
                <FaBoxOpen />
              </div>

              <div>
                <p className="bd-stat-value">
                  {pendingOrders}
                </p>

                <p className="bd-stat-label">
                  Pending Orders
                </p>
              </div>

            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card bd-stat-card h-100">
            <div className="card-body d-flex align-items-center gap-3">

              <div
                className="bd-stat-icon"
                style={{
                  background: "#16A34A",
                }}
              >
                <FaRupeeSign />
              </div>

              <div>
                <p className="bd-stat-value">
                  ₹{totalSpent.toLocaleString()}
                </p>

                <p className="bd-stat-label">
                  Total Spent
                </p>
              </div>

            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card bd-stat-card h-100">
            <div className="card-body d-flex align-items-center gap-3">

              <div
                className="bd-stat-icon"
                style={{
                  background: "#DB2777",
                }}
              >
                <FaHeart />
              </div>

              <div>
                <p className="bd-stat-value">
                  {wishlist.length}
                </p>

                <p className="bd-stat-label">
                  Wishlist Items
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="bd-tabs mb-4">

        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`bd-tab-btn ${
              activeTab === tab.key
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(tab.key)
            }
          >
            {tab.icon} {tab.label}

            {!!tab.badge && (
              <span className="bd-tab-badge">
                {tab.badge}
              </span>
            )}
          </button>
        ))}

      </div>

      {loading ? (
        <div className="text-center py-5">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <p className="mt-2">
            Loading your dashboard...
          </p>

        </div>
      ) : (
        <div className="card bd-panel">
          <div className="card-body">

            {/* Overview */}
            {activeTab === "overview" && (
              <div>

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <h5 className="mb-0">
                    Recent Orders
                  </h5>

                  <Link
                    to="/products"
                    className="btn btn-sm btn-primary"
                  >
                    <FaPlus className="me-1" />
                    Shop More
                  </Link>

                </div>

                {orders.length === 0 ? (
                  <div className="bd-empty">

                    <FaInbox />

                    <p className="mb-0">
                      No orders yet. Start shopping!
                    </p>

                  </div>
                ) : (
                  <div className="table-responsive">

                    <table className="table align-middle">

                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Product</th>
                          <th>Status</th>
                          <th>Total</th>
                        </tr>
                      </thead>

                      <tbody>

                        {orders
                          .slice(0, 5)
                          .map((order) => (
                            <tr key={order.id}>

                              <td>
                                #{order.id}
                              </td>

                              <td>
                                {order.productName || "-"}
                              </td>

                              <td>
                                {statusBadge(
                                  order.status
                                )}
                              </td>

                              <td>
                                ₹ {order.total || 0}
                              </td>

                            </tr>
                          ))}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>
            )}

            {/* Orders */}
            {activeTab === "orders" && (
              <div>

                <div className="bd-toolbar mb-3">

                  <div
                    className="input-group"
                    style={{ maxWidth: 280 }}
                  >

                    <span className="input-group-text bg-white border-end-0">
                      <FaSearch className="text-muted" />
                    </span>

                    <input id="bd-order-search" name="order-search"
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by order ID or product"
                      value={orderSearch}
                      onChange={(e) =>
                        setOrderSearch(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <select id="bd-order-status-filter" name="order-status-filter"
                    className="form-select"
                    style={{
                      maxWidth: 180,
                    }}
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value
                      )
                    }
                  >
                    <option value="all">
                      All Statuses
                    </option>

                    <option value="pending">
                      Pending
                    </option>

                    <option value="shipped">
                      Shipped
                    </option>

                    <option value="delivered">
                      Delivered
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>

                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bd-empty">

                    <FaInbox />

                    <p className="mb-0">
                      No orders match your search.
                    </p>

                  </div>
                ) : (
                  <div className="table-responsive">

                    <table className="table align-middle">

                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Product</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th></th>
                        </tr>
                      </thead>

                      <tbody>

                        {filteredOrders.map(
                          (order) => {

                            const normalizedStatus =
                              (
                                order.status || ""
                              ).toLowerCase();

                            return (
                              <tr
                                key={order.id}
                              >

                                <td>
                                  #{order.id}
                                </td>

                                <td>
                                  {order.productName ||
                                    "-"}
                                </td>

                                <td>
                                  {statusBadge(
                                    order.status
                                  )}
                                </td>

                                <td>
                                  ₹ {order.total || 0}
                                </td>

                                <td>

                                  {![
                                    "cancelled",
                                    "delivered",
                                  ].includes(
                                    normalizedStatus
                                  ) && (
                                    <button
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() =>
                                        handleCancelOrder(
                                          order.id
                                        )
                                      }
                                    >
                                      Cancel
                                    </button>
                                  )}

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>
            )}

            {/* Wishlist */}
            {activeTab === "wishlist" && (
              <div>

                <h5 className="mb-3">
                  My Wishlist
                </h5>

                {wishlist.length === 0 ? (
                  <div className="bd-empty">

                    <FaHeart />

                    <p className="mb-0">
                      Your wishlist is empty.
                    </p>

                  </div>
                ) : (
                  <div className="row g-3">

                    {wishlist.map((item) => (
                      <div
                        className="col-md-4"
                        key={item.id}
                      >

                        <div className="card bd-item-card h-100">

                          <img
                            src={
                              item.imageUrl ||
                              item.image ||
                              "https://via.placeholder.com/300x200?text=No+Image"
                            }
                            alt={item.name}
                            style={{
                              width: "100%",
                              aspectRatio: "4 / 3",
                              objectFit: "cover",
                              borderTopLeftRadius: "inherit",
                              borderTopRightRadius: "inherit",
                            }}
                          />

                          <div className="card-body">

                            <div className="d-flex justify-content-between align-items-start mb-2">

                              <h6 className="mb-1">
                                {item.name}
                              </h6>

                              <button
                                className="btn btn-sm btn-link text-danger p-0"
                                title="Remove from wishlist"
                                onClick={() =>
                                  removeFromWishlist(
                                    item.id
                                  )
                                }
                              >
                                <FaTrash />
                              </button>

                            </div>

                            <span className="text-muted d-block mb-2">
                              ₹ {item.price}
                            </span>

                            <button
                              className="btn btn-primary btn-sm w-100"
                              onClick={() =>
                                addWishlistItemToCart(
                                  item
                                )
                              }
                            >
                              Add to Cart
                            </button>

                          </div>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

              </div>
            )}

            {/* Addresses */}
            {activeTab === "addresses" && (
              <div>

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <h5 className="mb-0">
                    Saved Addresses
                  </h5>

                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={openAddAddress}
                  >
                    <FaPlus className="me-1" />
                    Add Address
                  </button>

                </div>

                {addresses.length === 0 ? (
                  <div className="bd-empty">

                    <FaMapMarkerAlt />

                    <p className="mb-0">
                      No saved addresses yet.
                    </p>

                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div
                      className="card bd-item-card mb-2"
                      key={addr.id}
                    >

                      <div className="card-body d-flex justify-content-between align-items-start">

                        <div>

                          <h6 className="mb-1">

                            {addr.label}

                            {addr.isDefault && (
                              <span className="badge bg-primary ms-2">
                                Default
                              </span>
                            )}

                          </h6>

                          <p className="mb-0 text-muted">
                            {addr.line}
                          </p>

                        </div>

                        <div className="d-flex gap-2">

                          {!addr.isDefault && (
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() =>
                                setDefaultAddress(
                                  addr.id
                                )
                              }
                            >
                              <FaCheckCircle />
                            </button>
                          )}

                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() =>
                              openEditAddress(addr)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              deleteAddress(addr.id)
                            }
                          >
                            <FaTrash />
                          </button>

                        </div>

                      </div>

                    </div>
                  ))
                )}

              </div>
            )}

            {/* Payments */}
            {activeTab === "payments" && (
              <div>

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <h5 className="mb-0">
                    Payment Methods
                  </h5>

                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={openAddPayment}
                  >
                    <FaPlus className="me-1" />
                    Add Payment Method
                  </button>

                </div>

                {payments.length === 0 ? (
                  <div className="bd-empty">

                    <FaWallet />

                    <p className="mb-0">
                      No payment methods saved.
                    </p>

                  </div>
                ) : (
                  payments.map((pay) => (
                    <div
                      className="card bd-item-card mb-2"
                      key={pay.id}
                    >

                      <div className="card-body d-flex justify-content-between align-items-center">

                        <div>

                          <h6 className="mb-1">

                            {pay.method}

                            {pay.isDefault && (
                              <span className="badge bg-primary ms-2">
                                Default
                              </span>
                            )}

                          </h6>

                          <p className="mb-0 text-muted">
                            {pay.detail}
                          </p>

                        </div>

                        <div className="d-flex gap-2">

                          {!pay.isDefault && (
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() =>
                                setDefaultPayment(
                                  pay.id
                                )
                              }
                            >
                              <FaCheckCircle />
                            </button>
                          )}

                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() =>
                              openEditPayment(pay)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              deletePayment(pay.id)
                            }
                          >
                            <FaTrash />
                          </button>

                        </div>

                      </div>

                    </div>
                  ))
                )}

              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div>

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <h5 className="mb-0">
                    My Reviews
                  </h5>

                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={openAddReview}
                  >
                    <FaPlus className="me-1" />
                    Write a Review
                  </button>

                </div>

                {reviews.length === 0 ? (
                  <div className="bd-empty">

                    <FaStar />

                    <p className="mb-0">
                      You haven't written any reviews yet.
                    </p>

                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      className="card bd-item-card mb-2"
                      key={rev.id}
                    >

                      <div className="card-body">

                        <h6 className="mb-1">
                          {rev.product}
                        </h6>

                        <div className="mb-1">

                          {Array.from({
                            length: 5,
                          }).map((_, i) => (
                            <FaStar
                              key={i}
                              color={
                                i < rev.rating
                                  ? "#ffc107"
                                  : "#e0e0e0"
                              }
                            />
                          ))}

                        </div>

                        <p className="mb-0 text-muted">
                          {rev.comment}
                        </p>

                      </div>

                    </div>
                  ))
                )}

              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div>

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <h5 className="mb-0">
                    Notifications
                  </h5>

                  <div className="d-flex gap-2">

                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </button>

                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={
                        clearAllNotifications
                      }
                    >
                      Clear all
                    </button>

                  </div>

                </div>

                {notifications.length === 0 ? (
                  <div className="bd-empty">

                    <FaBell />

                    <p className="mb-0">
                      You're all caught up!
                    </p>

                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">

                    {notifications.map(
                      (note) => (
                        <div
                          className={`bd-notification ${
                            note.read
                              ? ""
                              : "unread"
                          }`}
                          key={note.id}
                          onClick={() =>
                            markNotificationRead(
                              note.id
                            )
                          }
                          role="button"
                        >

                          <div className="d-flex gap-2">

                            {!note.read && (
                              <span className="bd-notification-dot" />
                            )}

                            <span>
                              {note.message}
                            </span>

                          </div>

                          <small className="text-muted flex-shrink-0">
                            {note.time}
                          </small>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

            {/* Profile */}
            {activeTab === "profile" && (
              <div>

                <h5 className="mb-3">
                  Profile Information
                </h5>

                <div className="d-flex align-items-center gap-3 mb-4">

                  <div
                    className="bd-avatar"
                    style={{
                      background:
                        "var(--primary-color)",
                      color: "#fff",
                    }}
                  >
                    {getInitials(
                      profileForm.name
                    )}
                  </div>

                  <div>

                    <p className="mb-0 fw-bold">
                      {profileForm.name ||
                        "Your Name"}
                    </p>

                    <span className="text-muted">
                      {profile?.role || "BUYER"}
                    </span>

                  </div>

                </div>

                <div className="row g-3">

                  <div className="col-md-6">

                    <label className="form-label">
                      Name
                    </label>

                    <input id="bd-profile-name" name="profile-name"
                      type="text"
                      className="form-control"
                      value={
                        profileForm.name
                      }
                      onChange={(e) =>
                        setProfileForm(
                          (f) => ({
                            ...f,
                            name: e.target.value,
                          })
                        )
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Role
                    </label>

                    <input id="bd-profile-role" name="profile-role"
                      type="text"
                      className="form-control"
                      value={
                        profile?.role ||
                        "BUYER"
                      }
                      disabled
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Email
                    </label>

                    <input id="bd-profile-email" name="profile-email"
                      type="email"
                      className="form-control"
                      value={
                        profileForm.email
                      }
                      onChange={(e) =>
                        setProfileForm(
                          (f) => ({
                            ...f,
                            email: e.target.value,
                          })
                        )
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Phone
                    </label>

                    <input id="bd-profile-phone" name="profile-phone"
                      type="tel"
                      className="form-control"
                      value={
                        profileForm.phone
                      }
                      onChange={(e) =>
                        setProfileForm(
                          (f) => ({
                            ...f,
                            phone: e.target.value,
                          })
                        )
                      }
                    />

                  </div>

                  <div className="col-12">

                    <button
                      className="btn btn-primary"
                      onClick={saveProfile}
                    >
                      Save Changes
                    </button>

                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Address modal */}
      <Modal
        title={
          editingAddressId
            ? "Edit Address"
            : "Add Address"
        }
        show={showAddressModal}
        onClose={() =>
          setShowAddressModal(false)
        }
      >

        <div className="mb-3">

          <label className="form-label">
            Label
          </label>

          <input id="bd-address-label" name="address-label"
            type="text"
            className="form-control"
            placeholder="e.g. Home, Work"
            value={addressForm.label}
            onChange={(e) =>
              setAddressForm((f) => ({
                ...f,
                label: e.target.value,
              }))
            }
          />

        </div>

        <div className="mb-3">

          <label className="form-label">
            Address
          </label>

          <textarea id="bd-address-line" name="address-line"
            className="form-control"
            rows={3}
            placeholder="House no, Street, City, State - Pincode"
            value={addressForm.line}
            onChange={(e) =>
              setAddressForm((f) => ({
                ...f,
                line: e.target.value,
              }))
            }
          />

        </div>

        <button
          className="btn btn-primary w-100"
          onClick={saveAddress}
        >
          {editingAddressId
            ? "Save Changes"
            : "Add Address"}
        </button>

      </Modal>

      {/* Payment modal */}
      <Modal
        title={
          editingPaymentId
            ? "Edit Payment Method"
            : "Add Payment Method"
        }
        show={showPaymentModal}
        onClose={() =>
          setShowPaymentModal(false)
        }
      >

        <div className="mb-3">

          <label className="form-label">
            Method
          </label>

          <select id="bd-payment-method" name="payment-method"
            className="form-select"
            value={paymentForm.method}
            onChange={(e) =>
              setPaymentForm((f) => ({
                ...f,
                method: e.target.value,
              }))
            }
          >

            <option value="UPI">
              UPI
            </option>

            <option value="Credit Card">
              Credit Card
            </option>

            <option value="Debit Card">
              Debit Card
            </option>

            <option value="Net Banking">
              Net Banking
            </option>

          </select>

        </div>

        <div className="mb-3">

          <label className="form-label">
            Details
          </label>

          <input id="bd-payment-detail" name="payment-detail"
            type="text"
            className="form-control"
            placeholder="e.g. name@bank or card ending 1234"
            value={paymentForm.detail}
            onChange={(e) =>
              setPaymentForm((f) => ({
                ...f,
                detail: e.target.value,
              }))
            }
          />

        </div>

        <button
          className="btn btn-primary w-100"
          onClick={savePayment}
        >
          {editingPaymentId
            ? "Save Changes"
            : "Add Payment Method"}
        </button>

      </Modal>

      {/* Review modal */}
      <Modal
        title="Write a Review"
        show={showReviewModal}
        onClose={() =>
          setShowReviewModal(false)
        }
      >

        <div className="mb-3">

          <label className="form-label">
            Product
          </label>

          <input id="bd-review-product" name="review-product"
            type="text"
            className="form-control"
            placeholder="Which product is this review for?"
            value={reviewForm.product}
            onChange={(e) =>
              setReviewForm((f) => ({
                ...f,
                product: e.target.value,
              }))
            }
          />

        </div>

        <div className="mb-3">

          <label className="form-label d-block">
            Rating
          </label>

          <div className="bd-star-input">

            {Array.from({
              length: 5,
            }).map((_, i) => (
              <FaStar
                key={i}
                color={
                  i < reviewForm.rating
                    ? "#ffc107"
                    : "#e0e0e0"
                }
                onClick={() =>
                  setReviewForm((f) => ({
                    ...f,
                    rating: i + 1,
                  }))
                }
              />
            ))}

          </div>

        </div>

        <div className="mb-3">

          <label className="form-label">
            Comment
          </label>

          <textarea id="bd-review-comment" name="review-comment"
            className="form-control"
            rows={3}
            placeholder="Share your experience..."
            value={reviewForm.comment}
            onChange={(e) =>
              setReviewForm((f) => ({
                ...f,
                comment: e.target.value,
              }))
            }
          />

        </div>

        <button
          className="btn btn-primary w-100"
          onClick={saveReview}
        >
          Submit Review
        </button>

      </Modal>

    </div>
  );
};

export default BuyerDashboard;