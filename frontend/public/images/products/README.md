# BSP CART product photos

Run the downloader from this `frontend` directory:

```powershell
$env:PIXABAY_KEY="your_pixabay_api_key"
npm run images
```

Preview search queries without downloading:

```powershell
npm run images -- --dry
```

Limit to one category:

```powershell
npm run images -- --only=electronics-and-accessories
```

The script writes `public/images/products/<product-id>.jpg` and updates
`src/data/productImages.js` after each successful download. It resumes from
the manifest; use `--force` to replace existing photos.

Pixabay's top result can be imperfect. Review each downloaded image against
its product name before publishing. Products without a photo keep the offline
SVG thumbnail. Seller-uploaded Supabase Storage images are not changed.
