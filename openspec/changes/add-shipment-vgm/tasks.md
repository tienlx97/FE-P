# Tasks

- [x] 1.1 `types/index.js`: `ShipmentContainerType`, `ShipmentVgm`,
      `ShipmentVgmFormValues`
- [x] 1.2 `config/shipment-container-types.js`, `config/shipment-vgm-schema.js`
- [x] 1.3 `api/shipment-vgms.js` (list/create/update/delete),
      `hooks/use-shipment-vgms-query.js`, `hooks/use-shipment-vgm-form.js`
- [x] 1.4 `components/shipment-vgm-fields.jsx`,
      `components/shipment-vgm-form-dialog.jsx`
- [x] 1.5 `components/shipment-vgm-list-dialog.jsx` (list + add/edit/
      delete, `AlertDialog` confirmation on delete)
- [x] 1.6 `components/contracts-list.jsx`: "Quản lý VGM" icon button per
      shipment row in the "Xuất hàng" tab, opens
      `ShipmentVgmListDialog`
- [x] 1.7 `pnpm lint` / `pnpm typecheck` clean; `./harness/verify.sh`
      full pass
- [x] 1.8 `harness/PROGRESS.md` entry
- [x] 1.9 Live-verified 2026-09-03, after the backend deployed
      `/shipments` + `/shipments/{id}/vgm` (first pass was blocked, see
      history above). On shipment `26KCTLIVE01/SHP-01`: (a) confirmed —
      "Quản lý VGM" opens with title "VGM · 26KCTLIVE01/SHP-01". (b)
      confirmed — "Thêm VGM" created `CONT-001` (seal `SEAL-001`, `40'`,
      tare 2200/payload 26000/max gross 30480/net 25000/khối lượng bao bì
      500 kg); the client-side live preview (Gross weight 25500.00 kg,
      VGM 27700.00 kg) matched the backend-computed value shown in the
      list after save exactly. (c) confirmed — the delete icon opens the
      `AlertDialog` ("Xoá VGM CONT-001? Hành động này không thể hoàn
      tác."); confirming actually removed the row (list returned to
      "Chưa có bản ghi VGM"). (d) confirmed — editing pre-filled every
      field including the container-type `Selector` and reproduced the
      same live preview values.
- [x] 1.10 Show the backend-assigned `sequenceNumber` in the VGM table as
      “Số thứ tự”; add Shipment table columns for `shipmentNumber`,
      `customsDeclarationDate`, and `declarationValue`; verify the full
      harness and live UI.
