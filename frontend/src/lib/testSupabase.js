
import { supabase } from "./supabase";

export async function testSupabaseConnection() {
  try {
    const { error } = await supabase.auth.getSession();

    if (error) {
      console.error("Supabase test failed:", error.message);
      return false;
    }

    console.log("Supabase client connected successfully.");
    return true;
  } catch (error) {
    console.error("Supabase connection error:", error.message);
    return false;
  }
}
