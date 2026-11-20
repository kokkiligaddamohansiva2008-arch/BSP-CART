import { supabase } from "../lib/supabase";

const dataOrThrow = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export async function getProductReviews(productId) {
  return dataOrThrow(await supabase.from("product_reviews")
    .select("id,user_id,rating,comment,created_at")
    .eq("product_id", Number(productId))
    .order("created_at", { ascending: false }));
}

export async function submitVerifiedReview(productId, rating, comment) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sign in to review your purchase.");
  const body = String(comment || "").trim();
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)
    throw new Error("Select a rating from 1 to 5.");
  if (body.length < 10 || body.length > 2000)
    throw new Error("Your review must contain 10–2000 characters.");
  // RLS checks a delivered order containing this product. UI cannot forge it.
  return dataOrThrow(await supabase.from("product_reviews").upsert({
    product_id: Number(productId), user_id: auth.user.id,
    rating: Number(rating), comment: body, updated_at: new Date().toISOString(),
  }, { onConflict: "product_id,user_id" }).select().single());
}

export async function getOrderTracking(orderId) {
  return dataOrThrow(await supabase.from("order_tracking_events")
    .select("id,status,message,created_at").eq("order_id", Number(orderId))
    .order("created_at", { ascending: true }));
}

export async function getBuyerNotifications() {
  return dataOrThrow(await supabase.from("buyer_notifications")
    .select("id,title,message,read_at,created_at,order_id")
    .order("created_at", { ascending: false }).limit(50));
}

export async function markBuyerNotificationRead(id) {
  return dataOrThrow(await supabase.from("buyer_notifications")
    .update({ read_at: new Date().toISOString() }).eq("id", id).select("id").single());
}

export function watchBuyerOrders(userId, onChange) {
  if (!userId) return () => {};
  const channel = supabase.channel(`bsp-buyer-orders-${userId}`)
    .on("postgres_changes", {
      event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}`
    }, () => onChange())
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function getCurrentBuyerId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}
