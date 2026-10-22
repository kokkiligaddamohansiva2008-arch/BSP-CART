/*
| BSP CART — session helpers
| Logging out must remove ONLY the auth keys. The old code called
| localStorage.clear(), which also deleted every registered account
| (bsp_users), seller products, orders, wishlist and the cart.
*/
const AUTH_KEYS = ["token", "role", "userId", "name", "username"];

export function clearSession() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("bsp-session-changed"));
}

export function getSession() {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    name: localStorage.getItem("name"),
    username: localStorage.getItem("username"),
  };
}
