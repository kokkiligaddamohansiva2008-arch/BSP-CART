/**
 * BSP CART name-aware catalogue visuals.
 * Covers the sample catalogue and imported rows without using unrelated stock photos.
 * Seller-uploaded images always take priority; this is a fallback only.
 * A real product photograph should be added to productImages.js after verification.
 */
import { PRODUCT_PHOTOS } from "./productImages.js";
import { productThumbnail } from "./additionalProducts.js";

const RULES = [
  [/basmati|sona masoori|brown rice|idli rice|parboiled rice|rice flour/i, "🍚"],
  [/dal|rajma|chana|moong|urad|masoor|lentil|beans|peas/i, "🫘"],
  [/atta|maida|flour|rava|semolina|millet|oats|poha|vermicelli/i, "🌾"],
  [/oil|ghee|vinegar|syrup/i, "🫙"],
  [/salt|sugar|jaggery|spice|masala|turmeric|chilli|cumin|pepper|cardamom|clove|cinnamon|coriander/i, "🧂"],
  [/almond|cashew|raisin|dry fruit|nut/i, "🥜"],
  [/potato chips|nachos|namkeen|murukku|popcorn|snack/i, "🍿"],
  [/biscuits|cookies|rusk|wafer/i, "🍪"],
  [/chocolate|cocoa|candy|toffee|sweet|laddu|kaju katli/i, "🍫"],
  [/tea|chai/i, "🍵"], [/coffee/i, "☕"],
  [/juice|soda|cola|drink|lassi|buttermilk|water/i, "🥤"],
  [/milk|curd|yogurt|paneer|cheese|butter|cream/i, "🥛"],
  [/bread|bun|croissant|pav|pizza base/i, "🍞"],
  [/cake|muffin|donut|brownie/i, "🧁"],
  [/egg/i, "🥚"], [/noodle|pasta|macaroni/i, "🍝"],
  [/onion/i, "🧅"], [/potato|sweet potato/i, "🥔"], [/tomato/i, "🍅"],
  [/carrot/i, "🥕"], [/broccoli|cabbage|cauliflower|spinach|lettuce/i, "🥦"],
  [/chilli|capsicum|pepper/i, "🫑"], [/mushroom/i, "🍄"],
  [/banana/i, "🍌"], [/apple/i, "🍎"], [/orange|sweet lime/i, "🍊"],
  [/lemon/i, "🍋"], [/grape/i, "🍇"], [/mango/i, "🥭"],
  [/pineapple/i, "🍍"], [/watermelon/i, "🍉"], [/strawberry/i, "🍓"],
  [/coconut/i, "🥥"], [/avocado/i, "🥑"],
  [/soap|detergent|dishwash|cleaner|sanitizer/i, "🧼"],
  [/broom|mop|wiper|scrub|sponge/i, "🧹"],
  [/bucket|mug|bottle|glass|cup/i, "🥤"],
  [/toothbrush|toothpaste/i, "🪥"], [/shampoo|lotion|perfume|deodorant|cream/i, "🧴"],
  [/phone|mobile|smartphone|iphone/i, "📱"],
  [/laptop|notebook|computer/i, "💻"], [/keyboard/i, "⌨️"], [/mouse/i, "🖱️"],
  [/headphone|earbud|earphone|neckband/i, "🎧"],
  [/speaker|soundbar/i, "🔊"], [/camera|webcam/i, "📷"],
  [/watch|fitness band/i, "⌚"], [/charger|power bank|adapter/i, "🔌"],
  [/cable|usb|hdmi/i, "🔗"], [/television|\btv\b|monitor/i, "🖥️"],
  [/shirt|t-shirt|kurta|kurti|top/i, "👕"],
  [/jeans|trouser|pants/i, "👖"], [/dress|saree|gown/i, "👗"],
  [/shoe|sneaker|sandal|slipper/i, "👟"],
  [/bag|backpack|purse|wallet/i, "👜"],
  [/bed|mattress|pillow|blanket|cushion/i, "🛏️"],
  [/sofa|chair|stool/i, "🪑"], [/lamp|bulb|light|diya/i, "💡"],
  [/pan|cooker|kadai|pot|utensil/i, "🍳"],
  [/pen|pencil|notebook|diary|paper/i, "✏️"],
  [/book|dictionary/i, "📚"], [/toy|teddy|stuffed/i, "🧸"],
  [/ball|football|cricket|badminton|racquet|shuttlecock/i, "🏸"],
  [/helmet|cycle|bicycle/i, "🚲"],
  [/plant|flower|garden|seed/i, "🪴"],
  [/pet|dog|cat/i, "🐾"], [/hammer|drill|wrench|screwdriver|plier/i, "🔧"],
  [/gift|hamper|rakhi|festival|birthday/i, "🎁"],
];
const escapeXml = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (s) => String(s ?? "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const categoryLabels = { grocery:"Groceries",electronics:"Electronics",fashion:"Fashion",home:"Home & Kitchen" };
export function matchingProductVisual(name, category, id) {
  const nameText = String(name || "Product");
  const categoryText = String(category || "");
  const key = `extra-${slug(categoryText)}-${slug(nameText)}`;
  const curated = PRODUCT_PHOTOS[key] || PRODUCT_PHOTOS[String(id)] || null;
  if (curated) return /^https?:\/\//i.test(curated) ? curated : `/images/products/${curated}`;
  const emoji = RULES.find(([pattern]) => pattern.test(nameText))?.[1];
  if (!emoji) return productThumbnail(nameText, categoryText, id);
  const label = escapeXml(nameText.length > 34 ? nameText.slice(0, 33) + "…" : nameText);
  const categoryLabel = escapeXml(categoryLabels[categoryText] || categoryText.replace(/-/g, " ").slice(0, 28));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480"><rect width="480" height="480" rx="28" fill="#f8f3eb"/><rect x="56" y="55" width="368" height="286" rx="24" fill="#efe5d7"/><text x="240" y="253" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" font-size="150" text-anchor="middle">${emoji}</text><text x="240" y="382" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="#243047" text-anchor="middle">${label}</text><text x="240" y="415" font-family="Arial,sans-serif" font-size="15" fill="#80694f" text-anchor="middle">${categoryLabel}</text><text x="240" y="456" font-family="Arial,sans-serif" font-size="12" letter-spacing="2" fill="#8b6e49" text-anchor="middle">BSP CART · ILLUSTRATION</text></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
