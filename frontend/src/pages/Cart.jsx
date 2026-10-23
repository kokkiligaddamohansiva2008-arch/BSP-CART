import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import CartItem from "../components/CartItem";
import emptyCart from "../assets/emptycart.png";
import {
  useCartStore,
  setQuantity,
  removeFromCart,
  clearCart,
} from "../utils/cartStore";
import "./Cart.css";

const FREE_SHIPPING_AT = 499;

export default function Cart() {
  const { lines, items, subtotal, savings, shipping, total } = useCartStore();

  const handleRemove = async (id) => {
    const line = lines.find((l) => l.id === id);
    const res = await Swal.fire({
      title: "Remove this item?",
      text: line?.name,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#b5533c",
    });
    if (res.isConfirmed) removeFromCart(id);
  };

  const handleClear = async () => {
    const res = await Swal.fire({
      title: "Empty your cart?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Empty cart",
      confirmButtonColor: "#b5533c",
    });
    if (res.isConfirmed) clearCart();
  };

  if (lines.length === 0) {
    return (
      <div className="cart-page cart-empty">
        <img src={emptyCart} alt="" />
        <h1>Your cart is empty</h1>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/products" className="cart-btn cart-btn-primary">
          Start shopping
        </Link>
      </div>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100);

  return (
    <div className="cart-page">
      <div className="cart-head">
        <h1>
          Shopping Cart <span>({items} {items === 1 ? "item" : "items"})</span>
        </h1>
        <button type="button" className="cart-clear" onClick={handleClear}>
          Empty cart
        </button>
      </div>

      <div className="cart-layout">
        <section aria-label="Cart items">
          <div className="cart-ship">
            <p>
              {remaining > 0
                ? `Add ₹${remaining.toLocaleString("en-IN")} more for FREE delivery`
                : "🎉 You've unlocked FREE delivery"}
            </p>
            <div className="cart-ship-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          {lines.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onIncrease={(id) => setQuantity(id, item.quantity + 1)}
              onDecrease={(id) => setQuantity(id, item.quantity - 1)}
              onRemove={handleRemove}
            />
          ))}
        </section>

        <aside className="cart-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <div className="cart-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          {savings > 0 && (
            <div className="cart-row cart-save">
              <span>You save</span>
              <span>−₹{savings.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="cart-row">
            <span>Delivery</span>
            <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
          </div>
          <div className="cart-row cart-total">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>

          <Link to="/checkout" className="cart-btn cart-btn-primary">
            Proceed to checkout
          </Link>
          <Link to="/products" className="cart-btn cart-btn-ghost">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
