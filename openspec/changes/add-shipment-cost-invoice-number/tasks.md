# Tasks

- [x] 1.1 `config/shipment-schema.js`: `invoiceNumber` on
      `shipmentCostLineSchema` (optional, max 100)
- [x] 1.2 `hooks/use-shipment-cost-line-rows.js`,
      `hooks/use-shipment-form.js`: thread `invoiceNumber` through row
      state, `reset()`, and submit mapping
- [x] 1.3 `api/shipments.js`: `toCostsRequestBody()` sends
      `InvoiceNumber`
- [x] 1.4 `components/shipment-cost-lines-fields.jsx`: editable "Số hoá
      đơn" column
- [x] 1.5 `components/shipment-expanded-details.jsx`: read-only "Số hoá
      đơn" column
- [x] 1.6 `types/index.js`: `invoiceNumber` typedefs
- [x] 1.7 `components/contract-general-fields.jsx`: "Giá trị hợp đồng" +
      "Tiền tệ" onto one row via `FormGrid`/`StackItem`
- [x] 1.8 `./harness/verify.sh`; live browser verification against
      BE-kt-xnk
