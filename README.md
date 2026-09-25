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

V3.10: repaired preview, embedded logo, Designers page, designer deletion, phone/email normalization, local date.


## V3.10 update
- FL can now be toggled on/off for each drapery line item.
- When FL is off, no finished-length surcharge is applied and FL is omitted from the invoice description.
- Added optional Return measurement toggle. When enabled it prints as R-#".
- Added optional Overlap measurement toggle. When enabled it prints as Overlap-#".
- Return and Overlap are informational measurements only and do not automatically change pricing.


## V3.10 update
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


## V3.10 fixes
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


## V3.10 updates
- Added `L/I` to the Drapery Lining dropdown.
- L/I remains uppercase in the printed invoice description.
- FL is now always available for drapery measurements.
- FW is now the measurement that can be toggled on/off.
- Return and Overlap remain optional toggles.
- Fixed Add Another Measurement so the current row is synced from the live form before the UI rebuilds.
- The new measurement is now a deep copy of the previous row, including all currently typed values.
- Editing the copied row does not change or clear the previous measurement.
- Toggle changes also sync all other measurement values first, preventing typed entries from disappearing.
