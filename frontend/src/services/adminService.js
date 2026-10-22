/*
| Admin data layer.
| BSP CART currently runs on browser storage (login, register and seller
| products all live in localStorage), so the admin pages read and write the
| same data. No network calls are made, so there is nothing to "network error".
*/
import {
  PRODUCTS,
  getSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
} from "../data/catalog";
import { getOrderHistory } from "../utils/bspStorage";

const USERS_KEY = "bsp_users";
const ROLES = ["BUYER", "SELLER", "ADMIN"];

const readUsers = () => {
  try {
    const list = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const writeUsers = (list) => localStorage.setItem(USERS_KEY, JSON.stringify(list));

export const ROLE_LIST = ROLES;
export const LOW_STOCK = 5;

/* ------------------------------- Users -------------------------------- */

export function getUsers() {
  const products = PRODUCTS.filter((p) => p.isSellerAdded);
  return readUsers().map((u) => ({
    username: u.username,
    name: u.name || u.username,
    role: String(u.role || "BUYER").toUpperCase(),
    products: products.filter((p) => p.ownerUsername === u.username).length,
  }));
}

export function setUserRole(username, role) {
  if (!ROLES.includes(role)) throw new Error("Invalid role");
  writeUsers(readUsers().map((u) => (u.username === username ? { ...u, role } : u)));
}

export function deleteUser(username) {
  if (username === localStorage.getItem("username")) {
    throw new Error("You cannot delete your own account");
  }
  getSellerProducts(username).forEach((p) => deleteSellerProduct(p.id));
  writeUsers(readUsers().filter((u) => u.username !== username));
}

/* ------------------------------ Products ------------------------------ */

export function getProducts() {
  return PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    seller: p.seller || "—",
    image: p.images?.[0] || p.image,
    editable: !!p.isSellerAdded,
  }));
}

export function setProductStock(id, stock) {
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Enter a valid stock number");
  if (!updateSellerProduct(id, { stock })) throw new Error("Store products are read-only");
}

export function removeProduct(id) {
  if (!deleteSellerProduct(id)) throw new Error("Store products are read-only");
}

/* ------------------------------- Orders -------------------------------- */

export const getOrders = () => getOrderHistory();

export const errMsg = (e) => e?.message || "Something went wrong";
