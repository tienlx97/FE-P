# Party catalog UI requirements

## Independent catalogs
Customers and Suppliers have separate routes, caches and forms. Creating or
editing one never changes the other. Supplier-consuming workflows fetch
Suppliers; contract Buyer continues to fetch Customers.

## Full profile form
The standalone dialogs expose general identity, contact/invoice recipient,
payment/credit, multiple bank accounts, geography/multiple delivery addresses,
notes and extra fields. Required and formatted values are validated before
submission. Editing initializes every field and replaces submitted row lists.

## Navigation and feedback
Authorized users can reach both catalog pages from Logistics navigation. Lists
use AdvanceTable, show loading/error/pagination state and allow create/edit.
Backend validation/conflict errors remain visible in the dialog.
