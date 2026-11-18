# BSP CART marketplace upgrades — validation and configuration

This work preserves the existing React/Vite frontend, Supabase integration, and Vercel project.

## Product images

- The catalogue uses seller-uploaded images when available. Legacy duplicate/generic artwork is replaced with a name-based photograph mapping or a neutral "Photo unavailable" tile.
- \`npm run images:audit\` (inside \`frontend\`) reports the **sample** products missing real photos and invalid local mappings. \`npm run images:audit -- --remote\` attempts to check remote image reachability. This does **not** prove product/variant or licensing matches. Manually inspect each photo before approving it.
- \`/admin/products\` can filter image issues, including broken pictures as they load.
- Source photo references are listed at \`/images/products/photo-sources.html\`. Additional seller product photos must be checked against their exact listing name, manufacturer, color, and variant before claiming an exact match.
- **Coverage is not complete:** a neutral missing-photo tile is preferable to a wrongly labeled image.

## Search and shopping assistant

- The Products page supports minimum and maximum price, minimum rating, in-stock only, category and sort.
- The assistant is deliberately **catalogue-grounded** and provides on-site matching and navigation. It does **not** call an external LLM or invent products. A generative AI provider needs a future, authenticated server-side integration.
- \`npm run test:catalog\` validates core assistant matching and budget behavior.

## Newsletter

- The React footer calls the protected \`newsletter\` Supabase Edge Function, not an anonymous write to the subscribers table.
- Supabase project \`bspcart\` (project ref \`qiqcofcydessgbayuutp\`) includes \`newsletter_subscribers\` and \`newsletter_rate_limits\`. RLS denies direct public subscriber access. The function is public but rate-limited and has a honeypot field.
- Duplicate subscription requests intentionally get a generic success response to avoid revealing whether an address is already on the mailing list.
- The subscription popup displays **"You are subscribed successfully!"** only after the server indicates the signup is saved.
- Automated confirmation email delivery **requires** Gmail OAuth credentials configured as **Supabase Edge Function secrets**, not Vite/React variables. Add:
  - \`GMAIL_CLIENT_ID\`
  - \`GMAIL_CLIENT_SECRET\`
  - \`GMAIL_REFRESH_TOKEN\` (issued for the Gmail sender with \`https://www.googleapis.com/auth/gmail.send\` scope)
  - \`GMAIL_SENDER_EMAIL\` (the Gmail address authorized by the refresh token)
  - recommended: \`NEWSLETTER_IP_SALT\` (a random secret for rate limit hash salts), \`NEWSLETTER_ALLOWED_ORIGINS\` (optional comma-separated allowed preview URLs)
- Enable Gmail API in your Google Cloud project and configure its OAuth consent screen and authorized sender. Keep all credentials private. Use Google OAuth — do not paste a Gmail password into GitHub, Supabase SQL, or frontend code.
- The response includes \`emailSent: false\` when Gmail OAuth is not configured or sending fails. The browser must never claim a confirmation was sent unless \`emailSent\` is true.
- Verify the first subscriber receives email (including an unsubscribe link) before telling users email delivery is active.

## Orders and seller dashboard

- The Orders page refreshes recorded status every 60 seconds while visible and upon tab focus, showing toast notifications when status changes. It does **not** claim GPS/carrier tracking.
- Cancelling an order does not update the UI until the database confirms cancellation.
- Seller metrics show real inventory totals, low stock, category charts and attempt to load seller orders. When seller order ownership fields/functions are unavailable in the selected Supabase schema, the dashboard displays **Unavailable** instead of fabricated sales numbers.
- **Schema caution:** the currently connected \`bspcart\` project has a minimal \`products\` schema and lacks several seller/order fields assumed by older frontend code. Full seller-order segmentation, advanced fulfillment and transaction verification require a separate schema/RLS migration and live testing. These upgrades intentionally do not mutate existing orders/products.

## Pre-release checklist

1. Run \`npm ci\`, \`npm run test:catalog\`, \`npm run images:audit\`, \`npm run build\` inside \`frontend\`.
2. Test product search, categories, price and stock filters in the preview.
3. Test admin photo-issue filter and representative seller-uploaded photos.
4. Subscribe with a NEW email address, confirm the database row is saved, and verify no success is shown after an API failure.
5. Configure Gmail OAuth secrets and send/receive a real confirmation email before calling that feature fully enabled.
6. Test orders (including cancellation) with authenticated buyer/seller accounts and verify database status transitions.
7. Do not promote to Vercel production until the build and these checks pass.
