import { supabase } from "../lib/supabase";
import {
  loadProducts,
  getProductById as getCached,
  addSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  PRODUCTS,
} from "../data/catalog";

/*
| Product API on top of Supabase. Reads come from the shared catalog cache
| (loaded from the `products` table); writes go to Supabase first.
*/

export const getAllProducts = async () => (PRODUCTS.length ? PRODUCTS : loadProducts());

export const getProductById = async (id) => getCached(id);

export const searchProducts = async (keyword) => {
  const k = String(keyword || "").trim().toLowerCase();
  return PRODUCTS.filter((p) => p.name.toLowerCase().includes(k) || p.description.toLowerCase().includes(k));
};

export const getProductsByCategory = async (category) => PRODUCTS.filter((p) => p.category === category);

export const addProduct = (ownerUsername, ownerName, product) => addSellerProduct(ownerUsername, ownerName, product);
export const updateProduct = (id, product) => updateSellerProduct(id, product);
export const deleteProduct = (id) => deleteSellerProduct(id);

export { supabase };
