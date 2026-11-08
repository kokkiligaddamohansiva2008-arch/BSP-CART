# BSP CART product image assets

This directory stores the lightweight static fallback image used if a browser cannot render a product thumbnail.

The 360 sample-catalogue product thumbnails (20 products in each of 18 categories) are generated as compact, product-name-specific SVG data images by `frontend/src/data/additionalProducts.js`. This avoids hundreds of third-party image requests and prevents empty/broken image tiles when an external image host is unavailable.

Seller-uploaded product photos remain in Supabase Storage and are not replaced by these sample thumbnails. These generated SVGs are clean illustrative thumbnails, not photographs of the exact retail item.
