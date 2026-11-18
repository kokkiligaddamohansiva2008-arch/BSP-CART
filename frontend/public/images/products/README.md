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

## Reviewed browser-sourced photographs

- **Basmati Rice** (sample listing): [Basmati rice.JPG](https://commons.wikimedia.org/wiki/File:Basmati_rice.JPG), photographer **Turbo1232112321**, **CC BY-SA 4.0** (https://creativecommons.org/licenses/by-sa/4.0/). Image served from Wikimedia Commons; no modifications made. This photograph illustrates generic basmati rice, not a particular brand or packaging.

Only add browser-sourced images when the depicted product matches the listing and the license permits use with appropriate attribution. Do not use images copied from commercial retailers without permission. Review external links periodically; hosting verified copies is preferable when licensing and storage are arranged.
