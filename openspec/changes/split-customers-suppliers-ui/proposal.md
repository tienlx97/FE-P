# Customer and supplier catalogs UI

## Why
The backend now owns independent Customer and Supplier catalogs with the full
party profile shown in the supplied MISA reference forms. The frontend still
uses Customers everywhere and exposes only the former five fields.

## What changes
- Add an independent Suppliers page with create, update, list and search.
- Expand both party dialogs to the shared multi-tab profile: contact, payment
  terms, bank accounts, delivery addresses, notes and extra fields.
- Load customer/supplier groups and payment terms for their selectors.
- Keep contract Buyer on Customers; use Suppliers for shipment forwarder/cost
  provider, VGM carrier and commission recipient.
- Add route navigation, permission rules, tests and browser evidence.

Employee assignment remains an optional identifier in the payload until the
backend exposes a logistics-authorized employee lookup endpoint; existing
values are preserved when editing.
