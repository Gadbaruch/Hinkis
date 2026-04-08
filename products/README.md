# Product Pages Workflow

All product pages share one layout template rendered by:

- `../assets/js/product-pages.js`

## Why this matters

If you change the layout markup in `product-pages.js`, the change applies to every product page that uses `renderProductPage(...)`.

## Add a new product page

1. Copy `_template.html` to a new file (for example `my-plugin.html`).
2. Replace `replace-with-product-key` with your new key.
3. Add that key and content object to `../assets/js/product-pages.js` in the `PRODUCTS` map.
4. Add the new page link in site navigation if needed.
