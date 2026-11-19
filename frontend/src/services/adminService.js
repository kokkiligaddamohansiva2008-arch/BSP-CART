/*
 * Admin data comes from Supabase tables, not frontend-only demo catalogue
 * products. Database RLS allows cross-user reads only for accounts whose
 * signed JWT app_metadata.role is ADMIN.
 */
import { supabase } from "../lib/supabase";
import { loadProducts } from "../data/catalog";

const ROLES = ["BUYER", "SELLER", "ADMIN"];
export const ROLE_LIST = ROLES;
export const LOW_STOCK = 5;
export const errMsg = (e) => e?.message || "Something went wrong";

/* ------------------------------- Users -------------------------------- */
export async function getUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, email, role")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((u) => ({
    id: u.id,
    username: u.username || "—",
    email: u.email || "",
    name: u.name || u.username || "Unnamed user",
    role: String(u.role || "BUYER").toUpperCase(),
    // The existing products table has no seller owner_id column; don't
    // fabricate per-seller product counts.
    products: null,
  }));
}

export async function setUserRole(userId, role) {
  if (!ROLES.includes(role)) throw new Error("Invalid role");
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
}

export async function deleteUser(userId) {
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  if (error) throw error;
}

/* ------------------------------ Products ------------------------------ */
export async function getProducts() {
  const all = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category_id, categories(name), price, stock, image_url")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return all.map((p) => ({
    id: Number(p.id),
    name: p.name,
    category: p.categories?.name || "Uncategorised",
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    seller: "BSP CART",
    image: p.image_url || "",
    editable: true,
  }));
}

export async function setProductStock(id, stock) {
  if (!Number.isInteger(stock) || stock < 5) {
    throw new Error("Enter a stock quantity of at least 5");
  }
  const { data, error } = await supabase
    .from("products")
    .update({ stock })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Product not found or you do not have permission");
  await loadProducts();
}

export async function removeProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Product not found or you do not have permission");
  await loadProducts();
}

/* ------------------------------- Orders -------------------------------- */
export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
