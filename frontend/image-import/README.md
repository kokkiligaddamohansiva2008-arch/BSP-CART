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


## Requested photo corrections (dals, flours, vegetables)

The specific product-name map is already in
`frontend/src/data/uploadedProductImages.js`. It covers Toor, Moong, Chana,
Masoor and Urad Dal, Whole Wheat Atta, Maida, Cucumber, Ladies Finger (okra),
and French Beans (also recognised as fresh/green beans).

To upload only these items, commit
`BSP_CART_Dal_Flour_Vegetable_Image_Fix.zip` to this folder on `main`.
The workflow extracts ten distinct JPGs, updates the name mapping,
commits them, and deletes the ZIP. The complete
`BSP_CART_Catalogue_Images_GitHub_Import.zip` archive still works and covers
100 images. Use either archive, not both.

**Important:** The ZIP exists in the chat attachment, not in the GitHub repo
until someone uploads it. A mapping without its corresponding JPG will
intentionally show a labelled illustration instead of a broken or wrong photo.
Some owner-supplied dal and flour JPGs are catalogue illustrations, not
photographs of branded retail packaging.

"Dal" alone has no single correct photo; search for or list a specific dal
variety instead. "French Beans", "Fresh Beans" and "Green Beans" refer to the
same beans photo; they are aliases, not different product listings.
