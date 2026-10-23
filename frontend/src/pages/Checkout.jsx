import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useCartStore, clearLocalCart } from "../utils/cartStore";
import { placeOrder as placeOrderRpc } from "../services/orderService";
import { refreshOrders } from "../utils/bspStorage";
import "./Checkout.css";

const PAYMENT_METHODS = [
  { id: "COD", label: "Cash on Delivery", hint: "Pay when your order arrives" },
  { id: "UPI", label: "UPI", hint: "GPay, PhonePe, Paytm" },
  { id: "CARD", label: "Credit / Debit Card", hint: "Visa, Mastercard, RuPay" },
];

function loadSavedAddress() {
  try {
    return JSON.parse(localStorage.getItem("bsp_delivery_address") || "{}");
  } catch {
    return {};
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const { lines, items, subtotal, savings, shipping, total } = useCartStore();

  const [form, setForm] = useState(() => {
    const saved = loadSavedAddress();
    return {
      fullName: saved.fullName || localStorage.getItem("name") || "",
      mobile: saved.mobile || "",
      email: saved.email || "",
      address: saved.address || "",
      city: saved.city || "",
      state: saved.state || "",
      pincode: saved.pincode || "",
      paymentMethod: "COD",
    };
  });
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (lines.length === 0) navigate("/cart", { replace: true });
  }, [lines.length, navigate]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const validate = () => {
    const er = {};
    if (form.fullName.trim().length < 2) er.fullName = "Enter your full name";
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) er.mobile = "Enter a valid 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) er.email = "Enter a valid email";
    if (form.address.trim().length < 8) er.address = "Enter your full address";
    if (!form.city.trim()) er.city = "Required";
    if (!form.state.trim()) er.state = "Required";
    if (!/^\d{6}$/.test(form.pincode.trim())) er.pincode = "6-digit pincode";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!validate()) {
      Swal.fire({
        toast: true, position: "top-end", icon: "warning",
        title: "Please fix the highlighted fields", timer: 2000, showConfirmButton: false,
      });
      return;
    }

    setPlacing(true);
    let orderId;
    try {
      // Prices & stock are re-checked on the server inside place_order.
      orderId = await placeOrderRpc({ form, lines });
      localStorage.setItem("bsp_delivery_address", JSON.stringify(form));
    } catch (err) {
      setPlacing(false);
      Swal.fire({ icon: "error", title: "Couldn't place order", text: err.message || "Please try again." });
      return;
    }

    clearLocalCart();            // server already emptied the cart
    refreshOrders().catch(() => {});
    setPlacing(false);
    Swal.fire({
      icon: "success",
      title: "Order placed!",
      html: `Your order <b>${orderId}</b> has been confirmed.`,
      confirmButtonText: "View my orders",
    }).then(() => navigate("/orders"));
  };

  const field = (name, label, props = {}) => (
    <div className={`co-field ${errors[name] ? "has-error" : ""} ${props.wide ? "wide" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {props.textarea ? (
        <textarea id={name} name={name} rows="3" value={form[name]} onChange={update} />
      ) : (
        <input
          id={name} name={name} value={form[name]} onChange={update}
          type={props.type || "text"} inputMode={props.inputMode}
          maxLength={props.maxLength} autoComplete={props.autoComplete}
        />
      )}
      {errors[name] && <small role="alert">{errors[name]}</small>}
    </div>
  );

  return (
    <div className="co-page">
      <h1>Checkout</h1>
      <div className="co-steps" aria-hidden="true">
        <span className="done">1 · Cart</span>
        <span className="active">2 · Delivery &amp; payment</span>
        <span>3 · Confirmation</span>
      </div>

      <div className="co-layout">
        <form className="co-card" onSubmit={placeOrder} noValidate>
          <h2>Delivery details</h2>
          <div className="co-grid">
            {field("fullName", "Full name", { autoComplete: "name" })}
            {field("mobile", "Mobile number", { inputMode: "numeric", maxLength: 10, autoComplete: "tel" })}
            {field("email", "Email", { type: "email", wide: true, autoComplete: "email" })}
            {field("address", "Address", { textarea: true, wide: true })}
            {field("city", "City")}
            {field("state", "State")}
            {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6 })}
          </div>

          <h2>Payment method</h2>
          <div className="co-pay">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.id} className={form.paymentMethod === m.id ? "selected" : ""}>
                <input type="radio" name="paymentMethod" value={m.id}
                  checked={form.paymentMethod === m.id} onChange={update} />
                <span><strong>{m.label}</strong><small>{m.hint}</small></span>
              </label>
            ))}
          </div>

          <button type="submit" className="co-submit" disabled={placing}>
            {placing ? "Placing order…" : `Place order · ₹${total.toLocaleString("en-IN")}`}
          </button>
        </form>

        <aside className="co-card co-summary">
          <h2>Order summary</h2>
          <ul>
            {lines.map((l) => (
              <li key={l.id}>
                <span>{l.name} <em>× {l.quantity}</em></span>
                <span>₹{(l.price * l.quantity).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
          <div className="co-row"><span>Items ({items})</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
          {savings > 0 && <div className="co-row co-save"><span>You save</span><span>−₹{savings.toLocaleString("en-IN")}</span></div>}
          <div className="co-row"><span>Delivery</span><span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span></div>
          <div className="co-row co-total"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
          <Link to="/cart" className="co-back">← Edit cart</Link>
        </aside>
      </div>
    </div>
  );
}
