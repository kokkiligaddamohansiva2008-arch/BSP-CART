/*
| Admin data layer (Supabase). Everything here is protected by Row Level
| Security — only users whose profile role is ADMIN can read all users/orders
| or edit any product, regardless of what the browser claims.
*/
import { supabase } from "../lib/supabase";
import { PRODUCTS, loadProducts, updateSellerProduct, deleteSellerProduct } from "../data/catalog";

const ROLES = ["BUYER", "SELLER", "ADMIN"];

export const ROLE_LIST = ROLES;
export const LOW_STOCK = 5;
export const errMsg = (e) => e?.message || "Something went wrong";

/* ------------------------------- Users -------------------------------- */

export async function getUsers() {
  const { data, error } = await supabase.from("profiles").select("id, username, name, email, role").order("created_at");
  if (error) throw error;
  return data.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name || u.username,
    role: String(u.role || "BUYER").toUpperCase(),
    products: PRODUCTS.filter((p) => p.ownerId === u.id).length,
  }));
}

export async function setUserRole(userId, role) {
  if (!ROLES.includes(role)) throw new Error("Invalid role");
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteUser(userId) {
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
  await loadProducts(); // their products are gone too
}

/* ------------------------------ Products ------------------------------ */

export async function getProducts() {
  await loadProducts();
  return PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    seller: p.seller || "—",
    image: p.images?.[0] || p.image,
    editable: true, // admins can manage every product
  }));
}

export async function setProductStock(id, stock) {
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Enter a valid stock number");
  await updateSellerProduct(id, { stock });
}

export async function removeProduct(id) {
  await deleteSellerProduct(id);
}

/* ------------------------------- Orders -------------------------------- */

export async function getOrders() {
  const { data, error } = await supabase.from("orders").select("id, status, total, created_at");
  if (error) throw error;
  return data;
}
