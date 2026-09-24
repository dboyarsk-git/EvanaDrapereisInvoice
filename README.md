# Evana Draperies Estimate & Invoice Studio — Mock V2

A private, GitHub Pages-friendly estimate/invoice builder styled to match the Evana Draperies brand.

## V2 visual direction
- Deep forest-green workroom header
- Warm ivory/cream workspace
- Gold accents
- Evana circular logo
- Elegant serif headings with clean modern form controls
- Client-facing print/PDF invoice stays intentionally formal and close to the existing Evana invoice format

## Run locally
Open `index.html` in a browser.

## GitHub Pages
1. Create a new GitHub repository.
2. Upload everything inside this folder to the repository root.
3. Go to **Settings → Pages**.
4. Set **Deploy from a branch**.
5. Choose `main` and `/ (root)`.
6. Save.

## Data
This mock stores clients and saved invoice history in browser `localStorage`. Data therefore stays on that browser/device. A later version can use Supabase so multiple devices share the same records.

## Main files
- `index.html` — app structure
- `styles.css` — Evana aesthetic
- `app.js` — calculations, rooms, clients, invoice preview, local storage
- `assets/evana-logo.png` — Evana branding
