
import { supabase } from "./supabase";

export async function testProductsConnection() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price")
    .limit(5);

  if (error) {
    console.error("Products query failed:", error.message);
    return;
  }

  console.log("Products query succeeded:", data);
}
