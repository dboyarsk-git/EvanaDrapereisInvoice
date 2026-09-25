# Evana Draperies Invoice Builder — V3.2

GitHub Pages-ready static mockup.

## V3.2 updates
- Invoice numbering starts at 691 and auto-increments from saved invoices.
- Date defaults automatically to today's date.
- Euro Pinch Pleat is the default drapery style.
- Drapery workflow order: Style → Q Pair/Panel → Q Width → FL → FW → Lining → charges/details.
- Quantity is a compact single-digit field beside Pair/Panel.
- Automatic surcharge rules are shown in a toggleable section.
- Invoice descriptions list selected details on separate lines (no “Extras:” label).
- Client-facing invoice uses Company Name for Bill To, Phone 1, and Email 1 only.
- Dedicated Clients page for full client details and invoice history.
- Roman shades still round to the nearest 0.25 sq. ft.
- Manual final-price override retained.

## GitHub Pages
Upload every file/folder in this ZIP to the root of:
`EvanaDraperiesInvoice`

Then open:
`https://dboyarsk-git.github.io/EvanaDraperiesInvoice/`

Data is currently stored in browser localStorage for this mock version.


## V3.2 update
- Added editable discount controls at the end of the builder.
- Discount can be entered as a percentage or flat dollar amount.
- Custom discount label can be changed (for example: Designer Discount or Courtesy Discount).
- Invoice preview shows the discount as a separate negative line.
- Subtotal and final total update automatically.
- Saved invoices store the discount information and completed cash flow uses the final net total.


## V3.2 fixes
- Supply is now a normal room item with Quantity, Description, Price Per Unit, and Final Price.
- Supply items automatically total into the Supply line at the bottom of the invoice.
- Removed the old Supply Total Override field.
- Installation remains a manual invoice-level amount.
- Fixed numeric entry for panel quantity, widths, FL, and FW by preventing the form from rebuilding while you type.
- Automatic drapery surcharge badges still update live while dimensions are entered.
- Estimate / Invoice switch now explicitly updates the watermark and builder heading.
- Added cache-busting version tags for GitHub Pages so updated JavaScript/CSS loads instead of an older cached copy.

V3.16: repaired preview, embedded logo, Designers page, designer deletion, phone/email normalization, local date.


## V3.16 update
- FL can now be toggled on/off for each drapery line item.
- When FL is off, no finished-length surcharge is applied and FL is omitted from the invoice description.
- Added optional Return measurement toggle. When enabled it prints as R-#".
- Added optional Overlap measurement toggle. When enabled it prints as Overlap-#".
- Return and Overlap are informational measurements only and do not automatically change pricing.


## V3.16 update
- Drapery items can now contain multiple measurement sets under the same room/style.
- Use “+ Add Another Measurement” to add a second, third, etc. full measurement row.
- Each measurement row has its own:
  - Quantity
  - Pair / Panel
  - Width count
  - Optional FL
  - FW
  - Optional Return
  - Optional Overlap
- Additional measurement rows print directly underneath the first measurement on the invoice.
- Automatic width and length surcharges are calculated independently for each measurement row.
- Pattern Matching and Bump remain item-wide percentage charges and apply to each measurement row.
- The invoice Quantity column totals the quantities from all measurement rows in that drapery item.
- Additional measurement rows can be removed without deleting the whole drapery item.


## V3.16 fixes
- “+ Add Another Measurement” now duplicates the entire previous measurement row.
- The copied row includes:
  - Quantity
  - Pair / Panel
  - Width count
  - FL toggle and FL value
  - FW value
  - Return toggle and Return value
  - Overlap toggle and Overlap value
- FL / Return / Overlap checkboxes were rewritten with direct event handlers so the matching measurement field reliably appears/disappears.
- Removed the accidental duplicated “Return” label.


## V3.16 updates
- Added `L/I` to the Drapery Lining dropdown.
- L/I remains uppercase in the printed invoice description.
- FL is now always available for drapery measurements.
- FW is now the measurement that can be toggled on/off.
- Return and Overlap remain optional toggles.
- Fixed Add Another Measurement so the current row is synced from the live form before the UI rebuilds.
- The new measurement is now a deep copy of the previous row, including all currently typed values.
- Editing the copied row does not change or clear the previous measurement.
- Toggle changes also sync all other measurement values first, preventing typed entries from disappearing.


## V3.16 updates
- Drapery Style dropdown now uses:
  - Pinch Pleat
  - Euro Pleat
  - Euro Pinch Pleat
  - Flat Top
  - Flat Top w/ Tape
  - Goblet
  - Ripple Fold
  - Tape
  - Custom
- Drapery Lining dropdown now uses:
  - Unlined
  - Lined
  - L/I
  - Combo Lining
  - Blackout
  - Blackout / Interlined
- Added a dedicated Additional Charges section for Fanfold and Pin.
- Fanfold and Pin each reveal an editable dollar charge when checked.
- Those charges are included in the drapery final price.
- Fanfold / Pin print as separate description lines.
- Mobile PDF printing now forces the top company information and estimate/invoice information into two columns, matching the desktop print layout.
- Mobile print also forces the invoice table and bottom payment/totals area to keep their desktop proportions.
- Drapery invoice Quantity now totals all measurement-row quantities in that drapery item.


## V3.16 updates

### Roman Shades
- Inside Mount / Outside Mount selector.
- FW, FL, then Proj.
- Flaps toggle with editable Flaps Price.
- Valance toggle with editable Valance Price and Valance Q.
- Motorized = $450.
- Rowley Lifting System = $75.
- Cordless Lifting System = $120.
- Continuous Cord System = $100.
- Roman square footage still rounds to the nearest 0.25 sq. ft.

### Pillows
- Zipper / No Zipper selector before style.
- Styles: Plain, Flange, Self Cord, Brush Fringe, Contrast Flange, Ruffle Cord, Bolster, Custom.
- Trim toggle with Outside / Inside, Hand Sewn, and editable Trim Charge.
- Cord toggle with Ruffle Cord, Sheer Cord, Mini, Small, Large, Big, Jumbo, plus editable Cord Charge.
- Box Construction replaced by 4 Triangles.

### Terminology
- New controls use Match Print instead of Pattern Matching.
- Old saved Pattern Matching jobs remain compatible.

### Supply
- Supply defaults to a required 100% deposit.
- Deposit percentage is editable.
- Required deposit prints on the supply line and in the invoice totals.


## V3.16 updates

### Supabase sync + autosave
- Added local autosave so a page refresh does not wipe the current invoice draft.
- Added optional Supabase cloud sync so the same invoice builder data can stay in sync on phone and computer.
- Added a sync status strip and manual buttons: **Sync Now** and **Load Latest Cloud**.
- The synced bundle includes:
  - designers
  - saved invoices
  - current working draft

### Files added
- `sync.js` — cloud/local sync helper
- `supabase-config.js` — paste your Supabase URL + anon key here
- `supabase-setup.sql` — run this in Supabase SQL editor

### Setup
1. Create a Supabase project.
2. Run `supabase-setup.sql` in the SQL editor.
3. Open `supabase-config.js`.
4. Paste your project URL and anon public key.
5. Keep the same `workspaceId` on phone and computer.
6. Re-upload the site.

### Note
This is a lightweight single-workspace sync setup designed for your own private workflow.


## V3.16 updates

### Roman Shades — top treatment
- Replaced the old separate Flaps / Valance checkboxes with a 3-way selector:
  - None
  - Flaps
  - Valance
- Selecting Flaps or Valance reveals a details panel.
- The panel includes:
  - finished length (FL)
  - price
- Price defaults to $20 and remains fully editable.
- Flaps / Valance price is included in the Roman shade calculation per shade.
- Older saved drafts using the previous Flaps / Valance fields are migrated automatically when opened.


## V3.16 website password
- Added a password gate to both the Invoice Builder and Designers pages.
- Password: `Familyrules` (case-sensitive).
- The password itself is not stored in plain text in the JavaScript; the page checks a SHA-256 hash.
- After a successful login, that browser/device stays unlocked until **Lock Website** is pressed.
- Important: because this is a static GitHub Pages site, this is a convenience/privacy gate, not a substitute for Supabase Auth and restrictive RLS policies.


## V3.16 password fix
- Password gate is forced on new browser sessions.
- Password: Familyrules
- Reloading the same tab stays unlocked so active invoice work is not interrupted.
- Closing the tab/browser and reopening requires the password again.
- Lock Website immediately returns to the password screen.
- Removed the older permanent localStorage unlock flag.
- Supabase public project URL and publishable key are pre-filled in supabase-config.js.


## V3.17 designer import
Six designer/client records are automatically imported from the supplied invoice screenshots.
The import is de-duplicated by phone/email, so opening the site again will not keep adding copies.

Imported:
- Michelle McSwain — (704) 691-4314 — michellemcswain29@yahoo.com
- Clarissa + Michael — (917) 575-7710
- New Old / Mary Ludemann — (407) 267-4450 — mary@newold.com
- Beth Lomas — (704) 771-6370 — Lomasinteriors@gmail.com
- Philip McHugh — (704) 421-4644 — email TBD
- Lauren Casella — (704) 604-5515 — Lauren.e.casella@gmail.com

When Supabase is connected, these records are also pushed into the shared Evana workspace so they appear on both phone and computer.


## V3.18 fixes
- Imported designers are now hard-seeded directly into the Invoice Builder and Designer Library.
- This no longer relies only on sync.js, which is why the V3.17 badge could appear while the designer list was still empty.
- Imported records are still de-duplicated by phone/email.
- Mary Ludemann is stored under company New Old.
- Imported designers automatically sync to Supabase after startup when cloud sync is connected.
- Invoice numbering now starts at 692.
- Print mode hides the top Evana app header, sync strip, builder panel, password overlay, and preview heading.
- Only the actual estimate/invoice content is intended to print.
- Sync status now explicitly displays Cloud sync connected when the Supabase config is present.


## V3.19 reliability fix
- Removed the external Supabase JavaScript SDK dependency. Cloud sync now uses Supabase REST directly with the publishable key.
- Added seed-data.js that writes the six imported designers into local storage before the app starts.
- Added visible fallback designer cards directly in designers.html, so the contacts show even if JavaScript sync fails.
- Current draft invoice number is forced to at least 692.
- Cloud sync should now work without cdn.jsdelivr.net loading.
