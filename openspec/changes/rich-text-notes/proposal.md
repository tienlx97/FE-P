# Rich text "Ghi chú" for contracts, shipments and logistics costs

Notes were plain text areas; the Shipment had no note at all. Notes are now
edited with the Astryx rich text editor (`@astryxdesign/richtext`, canary,
pinned to the same Astryx commit as `@astryxdesign/lab`) and stored as
Markdown, so existing plain-text notes load unchanged and the API keeps a
string (BE `shipment-note-rich-text` adds `Shipment.Note` and widens cost
notes to 2000 characters).

- `RichTextNoteField` (shared): basic toolbar — bold, italic, underline,
  strikethrough, code, lists, quote; no headings. The toolbar link button is
  off (its dialog renders a nested `<form>` whose submit would reach the
  drawer's form); URLs become links through the auto-link plugin and the
  `[text](url)` shortcut. Underline has no Markdown form and is not kept.
- `RichTextNote` (shared) renders the Markdown with Astryx `Markdown` in
  tables and the shipment overview.
- Used for the contract note (both contract forms), the new shipment note
  (drawer section 4, overview section, shipment list column shown by default)
  and the logistics cost note (cost drawer, both cost tables). The note column
  of "Chi phí logistics" grows from 10% to 22% of the table with a minimum
  width, and a cost note can be 2000 characters instead of 500.
