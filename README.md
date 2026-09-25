# Evana Draperies Invoice Builder — V3.1

GitHub Pages-ready static mockup.

## V3.1 updates
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


## V3.1 update
- Added editable discount controls at the end of the builder.
- Discount can be entered as a percentage or flat dollar amount.
- Custom discount label can be changed (for example: Designer Discount or Courtesy Discount).
- Invoice preview shows the discount as a separate negative line.
- Subtotal and final total update automatically.
- Saved invoices store the discount information and completed cash flow uses the final net total.
