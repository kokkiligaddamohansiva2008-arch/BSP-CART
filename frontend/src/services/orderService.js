import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| Orders — all writes go through Postgres functions (see supabase/schema.sql)
| so stock, prices and permissions are enforced on the server.
|--------------------------------------------------------------------------
*/

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

/** Place an order. Returns the new order id (e.g. "BSP10000001"). */
export const placeOrder = async ({ form, lines }) => {
  if (!lines?.length) throw new Error("Your cart is empty.");
  // Sample cards currently have negative, frontend-only IDs. Block them
  // before RPC until they are imported into the Supabase products table.
  if (lines.some((line) => !Number.isSafeInteger(Number(line.id)) || Number(line.id) <= 0)) {
    throw new Error("Some products in your cart are sample listings and are not yet available for checkout. Only products saved in Supabase can be ordered.");
  }
  if (form.paymentMethod !== "COD") {
    throw new Error("Only Cash on Delivery is available until online payments are verified.");
  }
  return unwrap(
    await supabase.rpc("place_order", {
      p_items: lines.map((l) => ({ product_id: l.id, quantity: l.quantity })),
      p_payment_method: form.paymentMethod,
      p_full_name: form.fullName.trim(),
      p_mobile: form.mobile.trim(),
      p_email: form.email.trim(),
      p_address: form.address.trim(),
      p_city: form.city.trim(),
      p_state: form.state.trim(),
      p_pincode: form.pincode.trim(),
    })
  );
};

const flat = (o) => ({
  id: o.id,
  status: o.status,
  total: Number(o.total_amount ?? 0),
  date: o.created_at,
  paymentMethod: o.payment_method,
  productName: (o.order_items || []).map((i) => `${i.products?.name || "Product"} × ${i.quantity}`).join(", "),
  items: (o.order_items || []).map((i) => ({
    ...i,
    name: i.products?.name || "Product",
    image: i.products?.image_url || "",
    price: Number(i.unit_price ?? 0),
  })),
});

/** Logged-in buyer's orders, newest first. */
export const getMyOrders = async () => {
  const { data: u } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from("orders")
      .select("*, order_items(*, products(name, image_url))")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false })
  ).map(flat);
};

export const getOrderById = async (orderId) =>
  flat(unwrap(await supabase.from("orders").select("*, order_items(*, products(name, image_url))").eq("id", orderId).single()));

/** Cancel (only while Processing) — restocks the items. */
export const cancelOrder = async (orderId) => {
  unwrap(await supabase.rpc("cancel_order", { p_order_id: orderId }));
};

/** Orders that contain this seller's products. */
export const getSellerOrders = async () => {
  const { data: u } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from("orders")
      .select("*, order_items!inner(*)")
      .eq("order_items.seller_id", u.user.id)
      .order("created_at", { ascending: false })
  ).map(flat);
};

/** Seller / admin: Processing → Shipped → Delivered */
export const updateOrderStatus = async (orderId, status) => {
  unwrap(await supabase.rpc("update_order_status", { p_order_id: orderId, p_status: status }));
};
