
import { supabase } from "../lib/supabase";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Failed to fetch products:", error.message);
    throw error;
  }

  return data ?? [];
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Failed to fetch categories:", error.message);
    throw error;
  }

  return data ?? [];
}
