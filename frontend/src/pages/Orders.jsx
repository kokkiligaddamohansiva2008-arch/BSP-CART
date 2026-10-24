import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaTruck,
  FaClock,
  FaSearch,
  FaEye,
  FaTimes,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCalendarAlt,
  FaReceipt,
  FaRedo,
} from "react-icons/fa";
import { getProductById } from "../data/catalog";
import { getOrderHistory, refreshOrders } from "../utils/bspStorage";
import { cancelOrder as cancelOrderRpc } from "../services/orderService";
import { addToCart } from "../utils/cartStore";
import "../styles/orders.css";

const PAY_LABEL = { COD: "Cash on Delivery", UPI: "UPI", CARD: "Credit / Debit Card" };

const formatDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");
};

/* Orders come from Supabase (placed by Checkout through the place_order function). */
const loadStoredOrders = () => {
  const raw = getOrderHistory();
  return raw
    .map((o) => ({
      id: o.id,
      rawDate: o.date,
      date: formatDate(o.date),
      total: Number(o.total) || 0,
      status: o.status || "Processing",
      payment:
        o.status === "Cancelled"
          ? "Refund Processing"
          : o.paymentMethod === "COD"
          ? "Pay on delivery"
          : "Paid",
      paymentMethod: PAY_LABEL[o.paymentMethod] || o.paymentMethod || "—",
      address: o.address || "—",
      items: (o.items || []).map((i) => {
        const product = getProductById(i.productId);
        return {
          productId: i.productId,
          name: i.name || product?.name || "Product",
          quantity: i.qty || 1,
          price: i.price ?? product?.price ?? 0,
          image: i.image || product?.image,
        };
      }),
    }))
    .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    setOrders(loadStoredOrders());
    refreshOrders()
      .then(() => setOrders(loadStoredOrders()))
      .catch((e) => console.error("Could not load orders", e));
  }, []);

  /* =========================================================
     ORDER STATISTICS
  ========================================================= */

  const totalOrders = orders.length;

  const processingOrders = orders.filter(
    (order) => order.status === "Processing"
  ).length;

  const shippedOrders = orders.filter(
    (order) => order.status === "Shipped"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  /* =========================================================
     FILTER + SEARCH
  ========================================================= */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "All" ||
        order.status === statusFilter;

      const itemNames = order.items
        .map((item) => item.name)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        String(order.id).includes(query) ||
        order.status.toLowerCase().includes(query) ||
        itemNames.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  /* =========================================================
     STATUS HELPERS
  ========================================================= */

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "order-status delivered";

      case "Processing":
        return "order-status processing";

      case "Shipped":
        return "order-status shipped";

      case "Cancelled":
        return "order-status cancelled";

      default:
        return "order-status";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <FaCheckCircle />;

      case "Processing":
        return <FaClock />;

      case "Shipped":
        return <FaTruck />;

      case "Cancelled":
        return <FaTimes />;

      default:
        return <FaBoxOpen />;
    }
  };

  /* =========================================================
     PROGRESS
  ========================================================= */

  const getProgressStep = (status) => {
    switch (status) {
      case "Processing":
        return 2;

      case "Shipped":
        return 3;

      case "Delivered":
        return 4;

      case "Cancelled":
        return 0;

      default:
        return 1;
    }
  };

  /* =========================================================
     VIEW DETAILS
  ========================================================= */

  const viewDetails = (order) => {
    setSelectedOrder(order);
  };

  /* =========================================================
     TRACK ORDER
  ========================================================= */

  const trackOrder = (order) => {
    Swal.fire({
      title: `Track Order #${order.id}`,
      html: `
        <div class="tracking-popup">

          <div class="tracking-popup-step completed">
            <strong>Order Placed</strong>
            <span>Order successfully placed</span>
          </div>

          <div class="tracking-popup-step completed">
            <strong>Order Confirmed</strong>
            <span>Seller confirmed your order</span>
          </div>

          <div class="tracking-popup-step ${
            order.status === "Processing"
              ? "current"
              : "completed"
          }">
            <strong>Processing</strong>
            <span>Your order is being prepared</span>
          </div>

          <div class="tracking-popup-step ${
            order.status === "Shipped" ||
            order.status === "Delivered"
              ? "completed"
              : ""
          }">
            <strong>Shipped</strong>
            <span>Your package is on the way</span>
          </div>

          <div class="tracking-popup-step ${
            order.status === "Delivered"
              ? "completed"
              : ""
          }">
            <strong>Delivered</strong>
            <span>Package delivered successfully</span>
          </div>

        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#202a44",
    });
  };

  /* =========================================================
     CANCEL ORDER
  ========================================================= */

  const cancelOrder = (order) => {
    Swal.fire({
      title: "Cancel this order?",
      text: `Order #${order.id} will be cancelled.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel Order",
      cancelButtonText: "Keep Order",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        cancelOrderRpc(order.id)
          .then(() => refreshOrders())
          .catch((e) =>
            Swal.fire({ icon: "error", title: "Couldn't cancel", text: e.message })
          );
        setOrders((previousOrders) =>
          previousOrders.map((item) =>
            item.id === order.id
              ? {
                  ...item,
                  status: "Cancelled",
                  payment: "Refund Processing",
                }
              : item
          )
        );

        setSelectedOrder(null);

        Swal.fire({
          icon: "success",
          title: "Order Cancelled",
          text: `Order #${order.id} has been cancelled.`,
          confirmButtonColor: "#202a44",
        });
      }
    });
  };

  /* =========================================================
     BUY AGAIN
  ========================================================= */

  const buyAgain = (order) => {
    let added = 0;
    order.items.forEach((item) => {
      if (item.productId && addToCart(item.productId, item.quantity).ok) added += 1;
    });

    Swal.fire({
      icon: added ? "success" : "warning",
      title: added ? "Added to Cart" : "Unavailable",
      text: added
        ? `${added} item(s) from order #${order.id} have been added to your cart.`
        : "These items are no longer available.",
      confirmButtonColor: "#202a44",
    });
  };

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
  };

  return (
    <div className="orders-page">

      {/* =====================================================
          HERO HEADER
      ===================================================== */}

      <section className="orders-hero">

        <div className="container">

          <div className="orders-hero-content">

            <div>
              <span className="orders-label">
                BSP CART
              </span>

              <h1>My Orders</h1>

              <p>
                Track, manage and review all your
                purchases in one place.
              </p>
            </div>

            <div className="orders-hero-icon">
              <FaShoppingBag />
            </div>

          </div>

        </div>

      </section>

      <div className="container orders-container">

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <section className="order-stats">

          <div className="order-stat-card">

            <div className="stat-icon blue">
              <FaBoxOpen />
            </div>

            <div>
              <span>Total Orders</span>
              <strong>{totalOrders}</strong>
            </div>

          </div>

          <div className="order-stat-card">

            <div className="stat-icon orange">
              <FaClock />
            </div>

            <div>
              <span>Processing</span>
              <strong>{processingOrders}</strong>
            </div>

          </div>

          <div className="order-stat-card">

            <div className="stat-icon purple">
              <FaTruck />
            </div>

            <div>
              <span>Shipped</span>
              <strong>{shippedOrders}</strong>
            </div>

          </div>

          <div className="order-stat-card">

            <div className="stat-icon green">
              <FaCheckCircle />
            </div>

            <div>
              <span>Delivered</span>
              <strong>{deliveredOrders}</strong>
            </div>

          </div>

        </section>

        {/* =====================================================
            SEARCH + FILTER
        ===================================================== */}

        <section className="orders-controls">

          <div className="orders-search">

            <FaSearch />

            <input id="orders-search-by-order" name="search-by-order"
              type="search"
              placeholder="Search by order ID or product name..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                <FaTimes />
              </button>
            )}

          </div>

          <div className="status-filters">

            {[
              "All",
              "Processing",
              "Shipped",
              "Delivered",
              "Cancelled",
            ].map((status) => (
              <button
                key={status}
                type="button"
                className={
                  statusFilter === status
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(status)
                }
              >
                {status}
              </button>
            ))}

          </div>

        </section>

        {/* =====================================================
            ORDER RESULTS
        ===================================================== */}

        <div className="orders-result-header">

          <div>
            <h2>Your Orders</h2>

            <p>
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1
                ? "order"
                : "orders"}{" "}
              found
            </p>
          </div>

          {(search ||
            statusFilter !== "All") && (
            <button
              type="button"
              className="clear-order-filters"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}

        </div>

        {/* =====================================================
            NO ORDERS
        ===================================================== */}

        {filteredOrders.length === 0 ? (
          <div className="orders-empty">

            <div className="empty-icon">
              <FaBoxOpen />
            </div>

            <h3>No orders found</h3>

            <p>
              We couldn't find any orders matching
              your search or filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>
        ) : (

          /* ===================================================
             ORDER CARDS
          =================================================== */

          <div className="orders-list">

            {filteredOrders.map((order) => {

              const progress =
                getProgressStep(order.status);

              return (
                <article
                  className="order-card"
                  key={order.id}
                >

                  {/* ORDER HEADER */}

                  <div className="order-card-header">

                    <div>

                      <span className="order-number">
                        ORDER #{order.id}
                      </span>

                      <div className="order-date">
                        <FaCalendarAlt />
                        {order.date}
                      </div>

                    </div>

                    <div
                      className={getStatusClass(
                        order.status
                      )}
                    >
                      {getStatusIcon(
                        order.status
                      )}

                      {order.status}
                    </div>

                  </div>

                  {/* ORDER ITEMS */}

                  <div className="order-items">

                    {order.items.map(
                      (item, index) => (
                        <div
                          className="order-item"
                          key={`${order.id}-${index}`}
                        >

                          <div className="order-product-image">
                            <img
                              src={item.image}
                              alt={item.name}
                            />
                          </div>

                          <div className="order-product-info">

                            <h3>
                              {item.name}
                            </h3>

                            <p>
                              Quantity:{" "}
                              {item.quantity}
                            </p>

                          </div>

                          <strong>
                            ₹{" "}
                            {Number(
                              item.price
                            ).toLocaleString("en-IN")}
                          </strong>

                        </div>
                      )
                    )}

                  </div>

                  {/* DELIVERY PROGRESS */}

                  {order.status !==
                    "Cancelled" && (
                    <div className="delivery-progress">

                      <div className="progress-line">
                        <div
                          className="progress-line-filled"
                          style={{
                            width: `${
                              ((progress - 1) /
                                3) *
                              100
                            }%`,
                          }}
                        />
                      </div>

                      {[
                        {
                          label: "Ordered",
                          icon: <FaReceipt />,
                        },
                        {
                          label: "Confirmed",
                          icon: <FaCheckCircle />,
                        },
                        {
                          label: "Shipped",
                          icon: <FaTruck />,
                        },
                        {
                          label: "Delivered",
                          icon: <FaBoxOpen />,
                        },
                      ].map(
                        (step, index) => {

                          const stepNumber =
                            index + 1;

                          return (
                            <div
                              className={`progress-step ${
                                stepNumber <=
                                progress
                                  ? "completed"
                                  : ""
                              }`}
                              key={step.label}
                            >

                              <div className="progress-icon">
                                {step.icon}
                              </div>

                              <span>
                                {step.label}
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                  {/* ORDER FOOTER */}

                  <div className="order-card-footer">

                    <div className="order-total">

                      <span>Order Total</span>

                      <strong>
                        ₹{" "}
                        {Number(
                          order.total
                        ).toLocaleString("en-IN")}
                      </strong>

                    </div>

                    <div className="order-actions">

                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() =>
                          viewDetails(order)
                        }
                      >
                        <FaEye />
                        View Details
                      </button>

                      {order.status !==
                        "Cancelled" && (
                        <button
                          type="button"
                          className="primary-action"
                          onClick={() =>
                            trackOrder(order)
                          }
                        >
                          <FaTruck />
                          Track Order
                        </button>
                      )}

                      {order.status ===
                        "Processing" && (
                        <button
                          type="button"
                          className="cancel-action"
                          onClick={() =>
                            cancelOrder(order)
                          }
                        >
                          Cancel
                        </button>
                      )}

                      {order.status ===
                        "Delivered" && (
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() =>
                            buyAgain(order)
                          }
                        >
                          <FaRedo />
                          Buy Again
                        </button>
                      )}

                    </div>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </div>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="order-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="order-modal-header">

              <div>
                <span>ORDER DETAILS</span>

                <h2>
                  #{selectedOrder.id}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
                aria-label="Close"
              >
                <FaTimes />
              </button>

            </div>

            <div className="order-modal-body">

              <div className="detail-grid">

                <div className="detail-box">

                  <FaCalendarAlt />

                  <div>
                    <span>Order Date</span>
                    <strong>
                      {selectedOrder.date}
                    </strong>
                  </div>

                </div>

                <div className="detail-box">

                  <FaCreditCard />

                  <div>
                    <span>Payment</span>
                    <strong>
                      {selectedOrder.payment}
                    </strong>
                  </div>

                </div>

                <div className="detail-box">

                  <FaMapMarkerAlt />

                  <div>
                    <span>Delivery Address</span>
                    <strong>
                      {selectedOrder.address}
                    </strong>
                  </div>

                </div>

                <div className="detail-box">

                  <FaReceipt />

                  <div>
                    <span>Payment Method</span>
                    <strong>
                      {selectedOrder.paymentMethod}
                    </strong>
                  </div>

                </div>

              </div>

              <h3 className="modal-section-title">
                Items
              </h3>

              <div className="modal-items">

                {selectedOrder.items.map(
                  (item, index) => (
                    <div
                      className="modal-item"
                      key={index}
                    >

                      <img
                        src={item.image}
                        alt={item.name}
                      />

                      <div>
                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          Qty:{" "}
                          {item.quantity}
                        </span>
                      </div>

                      <strong>
                        ₹{" "}
                        {Number(
                          item.price
                        ).toLocaleString("en-IN")}
                      </strong>

                    </div>
                  )
                )}

              </div>

              <div className="modal-total">

                <span>Total Amount</span>

                <strong>
                  ₹{" "}
                  {Number(
                    selectedOrder.total
                  ).toLocaleString("en-IN")}
                </strong>

              </div>

            </div>

            <div className="order-modal-footer">

              {selectedOrder.status ===
                "Processing" && (
                <button
                  type="button"
                  className="cancel-action"
                  onClick={() =>
                    cancelOrder(
                      selectedOrder
                    )
                  }
                >
                  Cancel Order
                </button>
              )}

              {selectedOrder.status ===
                "Delivered" && (
                <button
                  type="button"
                  className="primary-action"
                  onClick={() =>
                    buyAgain(selectedOrder)
                  }
                >
                  <FaRedo />
                  Buy Again
                </button>
              )}

              <button
                type="button"
                className="secondary-action"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Orders;