-- BSP CART sample seed for the EXISTING public app tables
-- Successfully applied to project qiqcofcydessgbayuutp on 2026-11-19.
-- Safe to re-run: inserts are idempotent (existing named records are kept).
-- Products are labeled DEMO with stock=0 to avoid accidental real orders.
-- DOES NOT create pretend customer profiles, real orders, carts, wishlists
-- or Auth accounts; those require a dedicated test buyer signed in via Auth.
BEGIN;

INSERT INTO public.categories (name) VALUES
  ('Groceries & Staples'),
  ('Snacks & Beverages'),
  ('Dairy & Bakery'),
  ('Fruits & Vegetables'),
  ('Household & Cleaning'),
  ('Kitchen & Dining'),
  ('Personal Care'),
  ('Stationery & Office'),
  ('Gifts & Festival')
ON CONFLICT (name) DO NOTHING;

WITH sample(category_name, product_name, price) AS (
 VALUES
  ('Groceries & Staples', 'BSP DEMO - Basmati Rice 1 kg', 120),
  ('Groceries & Staples', 'BSP DEMO - Toor Dal 1 kg', 160),
  ('Snacks & Beverages', 'BSP DEMO - Potato Chips 100 g', 35),
  ('Snacks & Beverages', 'BSP DEMO - Orange Juice 1 L', 95),
  ('Dairy & Bakery', 'BSP DEMO - Milk 1 L', 62),
  ('Dairy & Bakery', 'BSP DEMO - Whole Wheat Bread', 55),
  ('Fruits & Vegetables', 'BSP DEMO - Apples 1 kg', 180),
  ('Fruits & Vegetables', 'BSP DEMO - Tomatoes 1 kg', 42),
  ('Household & Cleaning', 'BSP DEMO - Dishwash Liquid 500 ml', 125),
  ('Household & Cleaning', 'BSP DEMO - Floor Cleaner 1 L', 145),
  ('Kitchen & Dining', 'BSP DEMO - Stainless Steel Cup', 85),
  ('Kitchen & Dining', 'BSP DEMO - Glass Storage Jar', 110),
  ('Personal Care', 'BSP DEMO - Hand Wash 250 ml', 65),
  ('Personal Care', 'BSP DEMO - Bath Soap 100 g', 38),
  ('Stationery & Office', 'BSP DEMO - Blue Ballpoint Pen Pack', 50),
  ('Stationery & Office', 'BSP DEMO - A5 Notebook', 70),
  ('Gifts & Festival', 'BSP DEMO - Gift Wrapping Paper', 35),
  ('Gifts & Festival', 'BSP DEMO - Greeting Card', 45),
  ('Electronics', 'BSP DEMO - USB C Cable', 199),
  ('Electronics', 'BSP DEMO - Phone Stand', 149),
  ('Clothing', 'BSP DEMO - Cotton T Shirt', 299),
  ('Clothing', 'BSP DEMO - Sports Socks', 99),
  ('Accessories', 'BSP DEMO - Keychain', 39),
  ('Accessories', 'BSP DEMO - Wallet', 249)
)
INSERT INTO public.products (name, description, price, stock, category_id)
SELECT s.product_name,
  'DEMO SAMPLE RECORD - not a real product; unavailable for purchase.',
  s.price, 0, c.id
FROM sample s
JOIN public.categories c ON c.name=s.category_name
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name=s.product_name);

INSERT INTO public.newsletter_subscribers (email, is_active)
VALUES ('bsp-cart-demo-inactive@example.invalid', false)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.newsletter_rate_limits (ip_hash,window_started,attempts)
VALUES ('bsp-cart-demo-seed-not-a-real-ip-hash',now()-interval '30 days',0)
ON CONFLICT (ip_hash) DO NOTHING;
COMMIT;

-- Verify contents:
SELECT 'categories' AS table_name,count(*) AS rows FROM public.categories
UNION ALL SELECT 'products',count(*) FROM public.products
UNION ALL SELECT 'profiles',count(*) FROM public.profiles
UNION ALL SELECT 'cart_items',count(*) FROM public.cart_items
UNION ALL SELECT 'wishlists',count(*) FROM public.wishlists
UNION ALL SELECT 'orders',count(*) FROM public.orders
UNION ALL SELECT 'order_items',count(*) FROM public.order_items
UNION ALL SELECT 'newsletter_subscribers',count(*) FROM public.newsletter_subscribers
UNION ALL SELECT 'newsletter_rate_limits',count(*) FROM public.newsletter_rate_limits
ORDER BY table_name;
