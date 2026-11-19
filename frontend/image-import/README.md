# BSP CART catalogue image ZIP import

This folder is watched by the GitHub Actions workflow
`.github/workflows/import-product-images.yml`.

Upload the single **BSP_CART_Catalogue_Images_GitHub_Import.zip** archive here
using GitHub's **Add file → Upload files** feature on the `main` branch.

GitHub Actions will unpack the JPEG photos into
`frontend/public/images/products/<category>/`, update
`frontend/src/data/uploadedProductImages.js`, commit the image files and
remove the uploaded ZIP. Existing JPEG files are preserved.

To import from a local clone instead: copy the ZIP into this folder and run
`python frontend/scripts/import_product_image_archive.py`, then commit and push.
