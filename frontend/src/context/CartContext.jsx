import { createContext, useContext, useEffect, useState } from "react";
import * as cartService from "../services/cartService";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Prototype logins (Login.jsx) issue "admin-token-…" / "mock-token-…" tokens
  // that the backend can't verify, so don't call the cart API with them.
  const hasRealToken = () => {
    const t = localStorage.getItem("token") || "";
    return !!t && !t.startsWith("admin-token-") && !t.startsWith("mock-token-");
  };

  const loadCart = async () => {
    if (!hasRealToken()) return;
    try {
      setLoading(true);

      const data = await cartService.getCart();

      setCartItems(data.items || []);
    } catch (error) {
      console.error("Failed to load cart", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const addItem = async (productId, quantity = 1) => {
    await cartService.addToCart(productId, quantity);
    await loadCart();
  };

  const increaseItem = async (cartItemId) => {
    await cartService.increaseQuantity(cartItemId);
    await loadCart();
  };

  const decreaseItem = async (cartItemId) => {
    await cartService.decreaseQuantity(cartItemId);
    await loadCart();
  };

  const removeItem = async (cartItemId) => {
    await cartService.removeCartItem(cartItemId);
    await loadCart();
  };

  const clearCart = async () => {
    await cartService.clearCart();
    setCartItems([]);
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        totalAmount,
        totalItems,
        loadCart,
        addItem,
        increaseItem,
        decreaseItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => useContext(CartContext);

export default CartContext;