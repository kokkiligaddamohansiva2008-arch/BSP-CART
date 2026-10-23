/*
|--------------------------------------------------------------------------
| BSP CART — Product catalog (Supabase)
|--------------------------------------------------------------------------
| Products live in the Supabase `products` table. This module keeps a
| shared in-memory copy (PRODUCTS) so Home / Products / ProductDetails keep
| their simple synchronous reads. The array is filled by loadProducts()
| (called once at startup by <ProductsGate/> and after every change) and is
| mutated IN PLACE so existing imports stay valid.
|
| Seller images go to the Supabase Storage bucket `product-images`
| (public URLs are saved in the product row — no more base64 in the browser).
*/
import { supabase } from "../lib/supabase";

export const CATEGORIES = [
  { id: "all", label: "All Stalls" },
  { id: "grocery", label: "Grocery" },
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "home", label: "Home & Kitchen" },
];

export const PRODUCTS = [];

const BUCKET = "product-images";
const CHANGED = "bsp-products-changed";

// Inline placeholder so a product with no photo never shows a broken image.
const DEFAULT_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#FAF6EF"/><text x="50%" y="50%" fill="#202A44" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'
  );

/* ------------------------------ mapping ------------------------------ */

// DB row -> the object shape the UI already uses
function fromRow(r) {
  const images = r.images?.length ? r.images : [DEFAULT_PRODUCT_IMAGE];
  return {
    id: Number(r.id),
    name: r.name,
    category: r.category,
    price: Number(r.price),
    mrp: Number(r.mrp),
    stock: Number(r.stock),
    seller: r.seller_name,
    rating: Number(r.rating) || 0,
    ratingCount: r.rating_count || 0,
    bestseller: !!r.bestseller,
    image: images[0],
    images,
    description: r.description || "",
    highlights: r.highlights || [],
    priceHistory: (r.price_history || []).map(Number),
    deal: r.deal || undefined,
    isSellerAdded: !!r.owner_id,
    ownerId: r.owner_id,
    ownerUsername: r.owner_username,
  };
}

const notify = () => window.dispatchEvent(new Event(CHANGED));

/** (Re)load the whole catalog from Supabase into PRODUCTS. */
export async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true });
  if (error) throw error;
  PRODUCTS.splice(0, PRODUCTS.length, ...data.map(fromRow));
  notify();
  return PRODUCTS;
}

export const onProductsChanged = (fn) => {
  window.addEventListener(CHANGED, fn);
  return () => window.removeEventListener(CHANGED, fn);
};

/* -------------------------- image upload (Storage) -------------------------- */

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error("Please sign in again.");
  return id;
}

// Uploads data-URL images to Storage; leaves http(s) links untouched.
async function uploadImages(userId, images) {
  const uploaded = [];
  const urls = [];
  for (const img of images) {
    if (!img || !String(img).startsWith("data:")) {
      if (img) urls.push(img);
      continue;
    }
    const blob = await (await fetch(img)).blob();
    const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
    if (error) {
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
      throw new Error("Image upload failed: " + error.message);
    }
    uploaded.push(path);
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return { urls, paths: uploaded };
}

const pathFromUrl = (url) => {
  const marker = `/object/public/${BUCKET}/`;
  const i = String(url).indexOf(marker);
  return i === -1 ? null : decodeURIComponent(String(url).slice(i + marker.length));
};

/* ------------------------- seller product CRUD ------------------------- */

export function getSellerProducts(ownerUsername) {
  return PRODUCTS.filter((p) => p.isSellerAdded && (!ownerUsername || p.ownerUsername === ownerUsername));
}

const imagesOf = (data) => (data.images?.length ? data.images : [data.image]).filter(Boolean);

/** Add one product for the signed-in seller. Returns the created product. */
export async function addSellerProduct(ownerUsername, ownerName, data) {
  return (await addSellerProducts(ownerUsername, ownerName, [data]))[0];
}

/** Add several products at once (all-or-nothing). Returns the created products. */
export async function addSellerProducts(ownerUsername, ownerName, list) {
  const userId = await currentUserId();
  const allPaths = [];

  try {
    const rows = [];
    for (const data of list) {
      const { urls, paths } = await uploadImages(userId, imagesOf(data));
      allPaths.push(...paths);
      const price = Number(data.price) || 0;
      rows.push({
        owner_id: userId,
        owner_username: ownerUsername,
        seller_name: ownerName || "You",
        name: data.name,
        category: data.category || "grocery",
        price,
        mrp: Number(data.mrp) || price,
        stock: Number(data.stock) || 0,
        description: data.description || "",
        images: urls,
        price_history: [price],
      });
    }

    const { data: inserted, error } = await supabase.from("products").insert(rows).select();
    if (error) throw new Error(error.message);

    const created = inserted.map(fromRow);
    PRODUCTS.push(...created);
    notify();
    return created;
  } catch (err) {
    if (allPaths.length) await supabase.storage.from(BUCKET).remove(allPaths);
    throw err;
  }
}

export async function updateSellerProduct(id, data) {
  const product = PRODUCTS.find((p) => p.id === Number(id));
  if (!product) return null;

  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.category !== undefined) patch.category = data.category;
  if (data.price !== undefined) patch.price = Number(data.price);
  if (data.mrp !== undefined) patch.mrp = Number(data.mrp);
  if (data.stock !== undefined) patch.stock = Number(data.stock);
  if (data.description !== undefined) patch.description = data.description;

  let newPaths = [];
  const imgs = imagesOf(data);
  if (imgs.length) {
    const { urls, paths } = await uploadImages(product.ownerId || (await currentUserId()), imgs);
    patch.images = urls;
    newPaths = paths;
  }

  const { data: rows, error } = await supabase.from("products").update(patch).eq("id", product.id).select();
  if (error || !rows?.length) {
    if (newPaths.length) await supabase.storage.from(BUCKET).remove(newPaths);
    throw new Error(error?.message || "You can't edit this product.");
  }

  // remove replaced images from Storage
  if (patch.images) {
    const stale = (product.images || []).filter((u) => !patch.images.includes(u)).map(pathFromUrl).filter(Boolean);
    if (stale.length) supabase.storage.from(BUCKET).remove(stale);
  }

  const updated = fromRow(rows[0]);
  PRODUCTS.splice(PRODUCTS.indexOf(product), 1, updated);
  notify();
  return updated;
}

export async function deleteSellerProduct(id) {
  const product = PRODUCTS.find((p) => p.id === Number(id));
  if (!product) return false;

  const { error, count } = await supabase.from("products").delete({ count: "exact" }).eq("id", product.id);
  if (error) throw new Error(error.message);
  if (!count) throw new Error("You can't delete this product.");

  const paths = (product.images || []).map(pathFromUrl).filter(Boolean);
  if (paths.length) supabase.storage.from(BUCKET).remove(paths);

  PRODUCTS.splice(PRODUCTS.indexOf(product), 1);
  notify();
  return true;
}

/* ------------------------------ helpers ------------------------------ */

export function getProductById(id) {
  const numId = Number(id);
  return PRODUCTS.find((p) => p.id === numId) || null;
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit);
}

export function getDealProducts() {
  return PRODUCTS.filter((p) => p.deal);
}

export function formatINR(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

export function discountPercent(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
