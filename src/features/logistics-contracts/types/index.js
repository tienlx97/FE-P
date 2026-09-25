export {};

/**
 * @typedef {'EXW' | 'FOB' | 'CIF' | 'DDP'} Incoterm
 */

/**
 * @typedef {'Draft' | 'Official'} ContractType
 */

/**
 * "Trạng thái hợp đồng" — independent of {@link ContractType} (Draft/
 * Official is a paperwork stage; this is the deal's real-world status).
 * @typedef {'NotStarted' | 'InProgress' | 'Completed' | 'Cancelled'} ContractStatus
 */

/**
 * "Tình trạng" Shipment — freely settable, covers every stage across the
 * business's CIF/DDP/FOB/EXW Incoterm flows (see `config/shipment-status.js`).
 * @typedef {'Booked' | 'Packing' | 'AtYardAwaitingExport' | 'Shipping' | 'DeliveredToPort' | 'CustomsDeclaration' | 'TruckingToSite' | 'Completed'} ShipmentStatus
 */

/**
 * @typedef {Object} ExtraField
 * @property {string} key
 * @property {string} value
 */

/**
 * @typedef {Object} PaymentTerm
 * @property {string} id
 * @property {number} paymentRatioPercent
 * @property {string} paymentCondition
 */

/**
 * One recorded payment ("lịch sử thanh toán") against a `Commission` — what
 * was actually paid to the third party, separate from `PaymentTerm` (the
 * agreed schedule).
 * @typedef {Object} CommissionPayment
 * @property {string} id
 * @property {string} paymentDate - ISO date (YYYY-MM-DD)
 * @property {number} amount
 * @property {string | null} note
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} companyName
 * @property {string | null} representativeName
 * @property {string | null} representativeTitle
 * @property {string | null} address
 * @property {PartyProfile} [profile]
 * @property {PartyBankAccount[]} [bankAccounts]
 * @property {PartyDeliveryAddress[]} [deliveryAddresses]
 * @property {ExtraField[]} extraFields
 * @property {string[]} [groupIds] Suppliers only — a supplier can be in several groups.
 */

/** @typedef {{id: string, name: string, supplierCount?: number}} PartyLookup */
/**
 * `id` comes back on responses only. `isDefault` = "Ưu tiên 1" (exactly one
 * per partner when it has accounts); accounts come back in entry order.
 * @typedef {{
 *   id?: string,
 *   accountNumber: string,
 *   bankName: string,
 *   branch: string,
 *   province: string,
 *   holder?: string | null,
 *   currency?: string,
 *   swiftCode?: string | null,
 *   isActive?: boolean,
 *   isDefault?: boolean,
 *   extraFields?: { key: string, value: string }[],
 * }} PartyBankAccount
 */
/** @typedef {{address: string}} PartyDeliveryAddress */
/**
 * @typedef {Object} PartyProfile
 * @property {string} code
 * @property {boolean} isOrganization
 * @property {string | null} taxCode
 * @property {string | null} budgetUnitCode
 * @property {string | null} phone
 * @property {string | null} website
 * @property {string | null} groupId
 * @property {string | null} employeeId
 * @property {boolean} isInternal
 * @property {string | null} contactSalutation
 * @property {string | null} contactName
 * @property {string | null} contactEmail
 * @property {string | null} contactPhone
 * @property {string | null} invoiceRecipientName
 * @property {string | null} invoiceRecipientEmails
 * @property {string | null} invoiceRecipientPhone
 * @property {string | null} paymentTermId
 * @property {number | null} dueDays
 * @property {number | null} creditLimit
 * @property {string | null} debtAccount
 * @property {string | null} country
 * @property {string | null} province
 * @property {string | null} district
 * @property {string | null} ward
 * @property {boolean} deliveryAddressSameAsMain
 * @property {string | null} notes
 */

/**
 * Independent supplier catalog entry. Profile/bank/delivery shapes mirror
 * Customer but never share state or identifiers semantically.
 * @typedef {Customer} Supplier
 */

/**
 * Seller catalog entry — the selling company. Same shape as {@link Customer}
 * (Party A's catalog) but a separate list, since seller and customer are
 * different business concepts even though their fields coincide.
 * @typedef {Object} Seller
 * @property {string} id
 * @property {string} companyName
 * @property {string | null} representativeName
 * @property {string | null} representativeTitle
 * @property {string | null} address
 * @property {ExtraField[]} extraFields
 * @property {import('@/shared/api/bank-accounts.js').BankAccount[]} [bankAccounts] Contract beneficiary banks are picked from these.
 */

/**
 * Buyer (bên mua) as recorded on one specific contract — a snapshot copied
 * from the {@link Customer} catalog (or typed inline) at creation time.
 * Renamed from `PartyA` on the wire (see `docs/api/Contracts.md`,
 * BE-kt-xnk).
 * @typedef {Object} Buyer
 * @property {string} companyName
 * @property {string | null} representativeName
 * @property {string | null} representativeTitle
 * @property {string | null} address
 * @property {string | null} sourceCustomerId
 * @property {ExtraField[]} extraFields
 */

/**
 * Country catalog entry — `Contract.CountryId` is a live reference to one
 * of these (not copied/snapshotted, unlike Seller/Buyer), so renaming a
 * `Country` changes how every referencing contract displays.
 * @typedef {Object} Country
 * @property {string} id
 * @property {string} name
 */

/**
 * Place catalog entry — lookup/suggestion only, scoped to one `Country`.
 * Does NOT constrain `Contract.placeOfLoading`/`placeOfDischarge`, which
 * stay free text.
 * @typedef {Object} Place
 * @property {string} id
 * @property {string} name
 * @property {string} countryId
 */

/**
 * Seller (bên bán) as recorded on one specific contract — a snapshot copied
 * from the {@link Seller} catalog (or typed inline) at creation time.
 * Mirrors {@link PartyA}.
 * @typedef {Object} ContractSeller
 * @property {string} companyName
 * @property {string | null} representativeName
 * @property {string | null} representativeTitle
 * @property {string | null} address
 * @property {string | null} sourceSellerId
 * @property {ExtraField[]} extraFields
 */

/**
 * "Bên thông báo"/"Đại lý nhận hàng" contact snapshot — `NotifyParty`/
 * `Consignee` on the wire (`ContractsController.MapToPartyContactResponse`,
 * BE-kt-xnk). Read-only in this app; there is no form for creating/editing
 * one yet.
 * @typedef {Object} ContractPartyContact
 * @property {string} name
 * @property {string | null} address
 * @property {string | null} sourceContactId
 * @property {ExtraField[]} extraFields
 */

/**
 * @typedef {Object} Contract
 * @property {number} version Phiên bản dữ liệu dùng để phát hiện chỉnh sửa đồng thời.
 * @property {string} id
 * @property {string} contractNumber
 * @property {ContractType} contractType
 * @property {string} createdDate - ISO date (YYYY-MM-DD)
 * @property {string} quotationDate - ISO date (YYYY-MM-DD)
 * @property {string} projectName
 * @property {string} category
 * @property {string} countryId - FK into the {@link Country} catalog (was the free-text `exportCountry`)
 * @property {string} placeOfLoading - was `portOfLoading`
 * @property {string | null} placeOfDischarge - "Cảng đến", was `portOrPlaceOfDestination`; free text, not constrained to the {@link Place} catalog. Required for every Incoterm; `null` only on older EXW/FOB contracts saved before that rule
 * @property {string | null} placeOfDelivery - "Nơi giao hàng" (e.g. the buyer's construction site); DDP only, `null` otherwise — see `requiresPlaceOfDelivery()`
 * @property {number} contractValue
 * @property {string} currency - 3-letter uppercase ISO 4217 code, e.g. "USD"
 * @property {Incoterm} incoterm
 * @property {number} incotermYear
 * @property {string} companyId - the company the contract belongs to (permissions are scoped by company, not branch)
 * @property {ContractSeller} seller
 * @property {Buyer} buyer - was `partyA`
 * @property {ContractPartyContact | null} notifyParty - "Bên thông báo"; not editable from this app yet, but BE-kt-xnk already returns it — read-only display only
 * @property {ContractPartyContact | null} consignee - "Đại lý nhận hàng"; not editable from this app yet, but BE-kt-xnk already returns it — read-only display only
 * @property {string | null} note
 * @property {PaymentTerm[]} paymentTerms
 * @property {string[]} bankIds
 * @property {boolean} sellerSigned - "Bên bán ký"
 * @property {boolean} buyerSigned - "Bên mua ký"
 * @property {string | null} projectCompletionDate - ISO date (YYYY-MM-DD), "ngày hoàn thành dự án" — `null` while the project isn't finished yet
 * @property {ContractStatus} status
 */

/**
 * @typedef {'AmountIncrease' | 'AmountDecrease' | 'ValueChange'} ContractAnnexType
 */

/**
 * Contract amendment ("phụ lục hợp đồng") — a historical record only, never
 * changes `Contract.contractValue`. `annexNumber`/`annexCode` are
 * system-assigned (BE-kt-xnk): `annexCode` is `{contractNumber}/AN-{annexNumber}`,
 * computed by the backend from the *current* contract number, so it can
 * change if the contract is renamed even though `annexNumber` itself never
 * does.
 * @typedef {Object} ContractAnnex
 * @property {string} id
 * @property {string} contractId
 * @property {number} annexNumber
 * @property {string} annexCode
 * @property {ContractAnnexType} type
 * @property {number} amount - Meaningless for `ValueChange` (see `note`).
 * @property {string} signedDate - ISO date (YYYY-MM-DD)
 * @property {boolean} buyerSigned
 * @property {boolean} sellerSigned
 * @property {string | null} note - Required for `ValueChange`: describes the
 *   (non-monetary) information that changed. Optional otherwise.
 */

/**
 * @typedef {Object} ContractAnnexFormValues
 * @property {ContractAnnexType | ''} type
 * @property {number | undefined} amount
 * @property {string} signedDate - ISO date (YYYY-MM-DD)
 * @property {boolean} buyerSigned
 * @property {boolean} sellerSigned
 * @property {string} note
 */

/**
 * Commission commission with a third party ("hoa hồng") for one specific
 * contract — at most one per contract, optional. `code` is user-entered
 * (BE-kt-xnk), same as {@link Contract}'s `contractNumber` — required,
 * unique system-wide, editable after creation. Uses the parent contract's
 * `currency` — no currency of its own. `sellerSigned` tracks whether the
 * *contract's* own Seller signed (not a separate snapshot); `partySigned`
 * tracks `partyCustomerId` (the commission recipient).
 * @typedef {Object} Commission
 * @property {string} id
 * @property {string} contractId
 * @property {string} code
 * @property {string} signedDate - ISO date (YYYY-MM-DD)
 * @property {string} partyCustomerId - FK into the {@link Customer} catalog — the commission recipient
 * @property {string | null} [bankAccountId] - the recipient's bank account it is paid to (BE `unify-bank-accounts`)
 * @property {number} value
 * @property {boolean} sellerSigned
 * @property {boolean} partySigned
 * @property {PaymentTerm[]} paymentTerms
 * @property {CommissionPayment[]} paymentHistory
 */

/**
 * @typedef {Object} CommissionFormValues
 * @property {string} code
 * @property {string} signedDate - ISO date (YYYY-MM-DD)
 * @property {string} partyCustomerId
 * @property {string} bankAccountId - '' = the recipient's default account
 * @property {number | undefined} value
 * @property {boolean} sellerSigned
 * @property {boolean} partySigned
 */

/**
 * @typedef {'AmountIncrease' | 'AmountDecrease' | 'InfoChange'} CommissionAnnexType
 */

/**
 * Amendment to a {@link Commission} — a historical record only,
 * never changes `value`/`paymentTerms`. `annexNumber` is backend-assigned,
 * sequential per commission; `annexCode` is
 * `{commission.code}/AN-{annexNumber}` (e.g. "26CM01/AN-01"),
 * computed by the backend, not stored.
 * @typedef {Object} CommissionAnnex
 * @property {string} id
 * @property {string} commissionId
 * @property {number} annexNumber
 * @property {string} annexCode
 * @property {string} signedDate - ISO date (YYYY-MM-DD)
 * @property {CommissionAnnexType} type
 * @property {number} amount
 * @property {boolean} sellerSigned
 * @property {boolean} partySigned
 */

/**
 * @typedef {Object} CommissionAnnexFormValues
 * @property {string} signedDate - ISO date (YYYY-MM-DD)
 * @property {CommissionAnnexType | ''} type
 * @property {number | undefined} amount
 * @property {boolean} sellerSigned
 * @property {boolean} partySigned
 */

/**
 * Values for the "Thêm nhanh" (quick-add) single-payment dialog — a
 * lighter-weight sibling of `CommissionPaymentRow`, used to submit one new
 * entry without opening the full Commission edit form.
 * @typedef {Object} CommissionPaymentFormValues
 * @property {string} paymentDate - ISO date (YYYY-MM-DD)
 * @property {number | undefined} amount
 * @property {string} note
 */

/**
 * A Contract's "Thông tin private" (internal BOQ — cost/pricing/profit),
 * gated by the `logistics:secret` permission (BE-kt-xnk,
 * `openspec/changes/add-contract-private-info/`) — unlike every other
 * `logistics:*` permission, this one is never granted by role/department,
 * only individually. `GET` never 404s once the contract itself exists: a
 * contract with no private info entered yet returns every field below as
 * `null` except `volumeDeclaration`, so "has it been filled in" is judged
 * from those fields, not from a separate existence flag.
 * `logisticsTotal` (`quotedPricePerContainer` × `containerCount`) and
 * `volumeDeclaration` (sum of every sibling Shipment's
 * `declarationWeightKg`) are both computed by the backend at read time —
 * never sent in a `PUT` body.
 * @typedef {Object} ContractPrivateInfo
 * @property {number} version Phiên bản dữ liệu dùng để phát hiện chỉnh sửa đồng thời.
 * @property {string | null} boqSentDate - ISO date (YYYY-MM-DD)
 * @property {number | null} containerCount
 * @property {number | null} costPricePerContainer
 * @property {number | null} quotedPricePerContainer
 * @property {number | null} logisticsTotal - computed, read-only
 * @property {number | null} unitCostLabor
 * @property {number | null} unitCostSandblasting
 * @property {number | null} unitCostPainting
 * @property {number | null} unitCostFactory
 * @property {number | null} volumeSale
 * @property {number | null} volumeMaterial
 * @property {number} volumeDeclaration - computed, read-only
 * @property {number | null} profit
 * @property {number | null} totalAmountUsd
 * @property {number | null} exchangeRateVnd
 * @property {ExtraField[]} extraFields
 */

/**
 * One row of the cross-contract "BOQ" list (`GET`/`POST search` on
 * `/contracts/private-info`, BE-kt-xnk) — a slimmer projection than
 * `ContractPrivateInfo`, just enough for the list's columns (no
 * `volumeDeclaration`/`extraFields`/`Đơn giá vốn`/`Khối lượng`/`Tổng
 * tiền`/`Tỷ giá` — open the row to see/edit the full BOQ).
 * @typedef {Object} ContractPrivateInfoListItem
 * @property {string} contractId
 * @property {string} contractNumber
 * @property {string} projectName
 * @property {number | null} containerCount
 * @property {number | null} costPricePerContainer
 * @property {number | null} quotedPricePerContainer
 * @property {number | null} logisticsTotal - computed, read-only
 * @property {number | null} profit
 */

/**
 * `PUT /contracts/{id}/private-info` body shape — every numeric field is
 * optional (`undefined` submits `null`), mirroring the backend's
 * `UpsertContractPrivateInfoCommandValidator` (no field is required to
 * fill in only part of the BOQ at a time). `boqSentDate` empty string
 * submits `null` (no date chosen), same convention as
 * `PaymentSchedule`'s date field.
 * @typedef {Object} ContractPrivateInfoFormValues
 * @property {string} boqSentDate - ISO date (YYYY-MM-DD), or '' for none
 * @property {number} [containerCount]
 * @property {number} [costPricePerContainer]
 * @property {number} [quotedPricePerContainer]
 * @property {number} [unitCostLabor]
 * @property {number} [unitCostSandblasting]
 * @property {number} [unitCostPainting]
 * @property {number} [unitCostFactory]
 * @property {number} [volumeSale]
 * @property {number} [volumeMaterial]
 * @property {number} [profit]
 * @property {number} [totalAmountUsd]
 * @property {number} [exchangeRateVnd]
 */

/**
 * @typedef {Object} Company
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} Branch
 * @property {string} id
 * @property {string} name
 * @property {string} companyId
 */

/**
 * @typedef {Object} ExtraFieldRow
 * @property {string} rowKey
 * @property {string} key
 * @property {string} value
 */

/**
 * @typedef {Object} PaymentTermRow
 * @property {string} rowKey
 * @property {number | undefined} paymentRatioPercent
 * @property {string} paymentCondition
 */

/**
 * @typedef {Object} CommissionPaymentRow
 * @property {string} rowKey
 * @property {string} paymentDate - ISO date (YYYY-MM-DD)
 * @property {number | undefined} amount
 * @property {string} note
 */

/**
 * @typedef {Object} PartyFormValues
 * @property {string} companyName
 * @property {string} code
 * @property {boolean} isOrganization
 * @property {string} taxCode
 * @property {string} budgetUnitCode
 * @property {string} phone
 * @property {string} website
 * @property {string} groupId
 * @property {string[]} groupIds
 * @property {string} employeeId
 * @property {boolean} isInternal
 * @property {string} representativeName
 * @property {string} representativeTitle
 * @property {string} address
 * @property {string} contactSalutation
 * @property {string} contactName
 * @property {string} contactEmail
 * @property {string} contactPhone
 * @property {string} invoiceRecipientName
 * @property {string} invoiceRecipientEmails
 * @property {string} invoiceRecipientPhone
 * @property {string} paymentTermId
 * @property {number | undefined} dueDays
 * @property {number | undefined} creditLimit
 * @property {string} debtAccount
 * @property {string} country
 * @property {string} province
 * @property {string} district
 * @property {string} ward
 * @property {boolean} deliveryAddressSameAsMain
 * @property {string} notes
 */

/**
 * The small inline buyer snapshot used by contract forms.
 * @typedef {Object} CustomerFormValues
 * @property {string} companyName
 * @property {string} representativeName
 * @property {string} representativeTitle
 * @property {string} address
 */

/**
 * @typedef {Object} SellerFormValues
 * @property {string} companyName
 * @property {string} representativeName
 * @property {string} representativeTitle
 * @property {string} address
 */

/**
 * @typedef {Object} CountryFormValues
 * @property {string} name
 */

/**
 * @typedef {Object} PlaceFormValues
 * @property {string} name
 * @property {string} countryId
 */

/**
 * @typedef {Object} ContractFormValues
 * @property {string} contractNumber
 * @property {ContractType | ''} contractType
 * @property {string} createdDate - ISO date (YYYY-MM-DD)
 * @property {string} quotationDate - ISO date (YYYY-MM-DD)
 * @property {string} projectCompletionDate - ISO date (YYYY-MM-DD), or '' while not yet completed
 * @property {string} projectName
 * @property {string} category
 * @property {string} countryId - FK into the {@link Country} catalog (was the free-text `exportCountry`)
 * @property {string} placeOfLoading - was `portOfLoading`
 * @property {string} placeOfDischarge - was `portOrPlaceOfDestination`; free text
 * @property {string} placeOfDelivery - DDP only, '' otherwise
 * @property {number | undefined} contractValue
 * @property {string} currency - 3-letter uppercase ISO 4217 code
 * @property {Incoterm | ''} incoterm
 * @property {number | undefined} incotermYear
 * @property {string} companyId - required; the company the contract belongs to (permissions are scoped by company, not branch)
 * @property {string} sourceSellerId - '' when Seller is entered inline
 * @property {SellerFormValues} sellerInline
 * @property {string} sourceCustomerId - '' when Buyer is entered inline
 * @property {CustomerFormValues} buyerInline - was `partyAInline`
 * @property {string} note
 * @property {string[]} bankIds
 * @property {boolean} sellerSigned - "Bên bán ký"
 * @property {boolean} buyerSigned - "Bên mua ký"
 * @property {ContractStatus | ''} status
 */

/**
 * @typedef {'TT' | 'LC'} PaymentType
 */

/**
 * Customer payment installment ("đợt thanh toán") after a `Contract` has
 * been signed. `paymentNumber`/`paymentCode` are system-assigned
 * (BE-kt-xnk): `paymentCode` is `{contractNumber}/PR-{paymentNumber:D2}`,
 * computed by the backend from the *current* contract number (same
 * live-reference pattern as `ContractAnnex.annexCode`), so it can change if
 * the contract is renamed even though `paymentNumber` itself never does.
 * Creating one requires `Contract.sellerSigned && Contract.buyerSigned`
 * (backend returns `400` otherwise) — updating an existing one does not
 * re-check this.
 * @typedef {Object} PaymentSchedule
 * @property {string} id
 * @property {string} contractId
 * @property {number} paymentNumber
 * @property {string} paymentCode
 * @property {string} paymentDate - ISO date (YYYY-MM-DD)
 * @property {number} amount
 * @property {PaymentType} type
 * @property {string | null} note
 */

/**
 * @typedef {Object} PaymentScheduleFormValues
 * @property {string} paymentDate - ISO date (YYYY-MM-DD)
 * @property {number | undefined} amount
 * @property {PaymentType | ''} type
 * @property {string} note
 */

/**
 * @typedef {'LCL' | 'FCL'} ShipmentType
 */

/**
 * @typedef {'Cont' | 'Kien'} ShipmentQuantityUnit
 */

/**
 * Logistics cost group ("nhóm chi phí") — the fixed LOG-01 … LOG-08 catalog
 * (BE-kt-xnk `add-shipment-cost-log-groups`, 2026-09-24): listed and
 * name/note-editable only, never created or deleted.
 * `ShipmentCostLine.costCategoryId` is a live, FK-enforced reference into it.
 * @typedef {Object} ShipmentCostCategory
 * @property {string} id
 * @property {string} code - "LOG-01" … "LOG-08"
 * @property {string} name
 * @property {string | null} note
 */

/**
 * "Standard" = normal cost of moving the goods (O/F, THC, D/O…);
 * "Abnormal" = incident cost (demurrage, detention, late-document storage,
 * container repair, B/L amendment…).
 * @typedef {'Standard' | 'Abnormal'} ShipmentCostNature
 */

/**
 * @typedef {Object} PartyGroupFormValues
 * @property {string} name
 */

/**
 * Autocomplete-suggestion catalog for `ShipmentCostLine.name` — lookup only,
 * does NOT constrain the free-text `name` on an actual cost line.
 * `costCategoryId` is the suggested default group for the suggestion.
 * @typedef {Object} ShipmentCostItemTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} costCategoryId
 */

/**
 * @typedef {Object} ShipmentCostItemTemplateFormValues
 * @property {string} name
 * @property {string} costCategoryId
 */

/**
 * One logistics cost line ("khoản chi phí") on a `Shipment.costs` — the
 * whole list is replaced on every PUT (same contract as
 * `Commission.paymentHistory`/`paymentTerms`). `amount` is always VNĐ, no
 * currency field. `costCategoryId` is a live, FK-enforced reference into
 * {@link ShipmentCostCategory}; `providerCustomerId` is a live, optional
 * reference into the {@link Customer} catalog.
 * @typedef {Object} ShipmentCostLine
 * @property {string} id
 * @property {string} costCategoryId
 * @property {string} name
 * @property {number} amount
 * @property {string | null} note
 * @property {string | null} providerCustomerId
 * @property {string | null} invoiceNumber - "Số hoá đơn", optional
 * @property {ShipmentCostNature} costNature
 */

/**
 * @typedef {Object} ShipmentCostLineFormValues
 * @property {string} costCategoryId
 * @property {string} name
 * @property {number} amount
 * @property {string} note
 * @property {string} providerCustomerId
 * @property {string} invoiceNumber
 * @property {ShipmentCostNature} costNature
 */

/**
 * @typedef {Object} ShipmentCostLineRow
 * @property {string} rowKey
 * @property {string} costCategoryId
 * @property {string} name
 * @property {number | undefined} amount
 * @property {string} note
 * @property {string} providerCustomerId
 * @property {string} invoiceNumber
 * @property {ShipmentCostNature} costNature
 */

/**
 * Server-computed (GET only, never sent on create/update) total `amount`
 * grouped by `costCategoryId` across a Shipment's `costs`.
 * @typedef {Object} ShipmentCostTotal
 * @property {string} costCategoryId
 * @property {string} costCategoryName
 * @property {number} totalAmount
 */

/**
 * One shipment ("lần xuất hàng") against a `Contract` — a contract has one
 * or more. Groups Book info (booking/B-L/vessel), Shipment/lot info, and
 * logistics cost info (`costs`/`costTotalsByCategory`).
 * `shipmentNumber`/`shipmentCode` are system-assigned (BE-kt-xnk):
 * `shipmentCode` is `{contractNumber}/LCL-{shipmentNumber:D2}` for LCL
 * shipments or `{contractNumber}/LOT-{shipmentNumber:D2}` for FCL (2026-
 * 09-03 business rule) — computed by the backend from the *current*
 * contract number (same live-reference pattern as
 * `ContractAnnex.annexCode`), so it can change if the contract is
 * renamed even though `shipmentNumber` itself never does. `type` is
 * immutable after creation (BE-kt-xnk) since both the code's prefix and
 * `shipmentNumber`'s own per-type sequence depend on it — LCL and FCL
 * each number independently within a contract, not one shared sequence.
 * `quantityUnit` is derived from `type` (LCL → Kiện, FCL → Cont), also
 * never independently settable.
 * `supplierCustomerId` ("Forwarder") is a live reference into the
 * {@link Customer} catalog (not a snapshot), same pattern as
 * `Commission.partyCustomerId`.
 * @typedef {Object} Shipment
 * @property {number} version Phiên bản dữ liệu dùng để phát hiện chỉnh sửa đồng thời.
 * @property {string} id
 * @property {string} contractId
 * @property {number} shipmentNumber
 * @property {string} shipmentCode
 * @property {string} supplierCustomerId
 * @property {string} bookingNumber
 * @property {string | null} billOfLadingNumber
 * @property {string | null} shippingLine
 * @property {string | null} vesselName
 * @property {string | null} etd - ISO date, "ngày dự kiến khởi hành"
 * @property {string | null} eta - ISO date, "ngày dự kiến đến"
 * @property {string | null} placeOfLoading - this shipment's own copy, not a live reference to `Contract.placeOfLoading` — defaults from it client-side on create only (see `use-shipment-form.js`)
 * @property {string | null} placeOfDischarge - this shipment's own copy, same default-once pattern as `placeOfLoading`
 * @property {ShipmentType} type
 * @property {string} name
 * @property {PaymentType} paymentCondition
 * @property {number} invoiceValue
 * @property {string} invoiceCurrency - 3-letter uppercase ISO 4217 code
 * @property {number} declarationValue
 * @property {string} declarationCurrency - 3-letter uppercase ISO 4217 code
 * @property {number} declarationExchangeRate
 * @property {number} declarationValueVnd - `declarationValue * declarationExchangeRate`, computed at read time, never stored
 * @property {number} quantityAmount
 * @property {ShipmentQuantityUnit} quantityUnit
 * @property {number} declarationWeightKg
 * @property {string | null} coNumber - customs-issued, manually entered
 * @property {string | null} coDeclarationDate - ISO date, "ngày khai C/O"
 * @property {string | null} coIssuedDate - ISO date, "ngày có C/O"
 * @property {string | null} customsDeclarationNumber - customs-issued, manually entered, "số tờ khai"
 * @property {string | null} customsDeclarationDate - ISO date, "ngày khai"
 * @property {boolean} customsInspected - "bị kiểm hoá"
 * @property {ShipmentCostLine[]} costs
 * @property {ShipmentCostTotal[]} costTotalsByCategory - computed at read time, never stored
 * @property {ShipmentStatus} status
 * @property {number} vgmCount - number of `ShipmentVgm` records, computed at read time, never stored (BE-kt-xnk `add-shipment-vgm-count`)
 * @property {ShipmentServiceProvider[]} [serviceProviders] - customs brokers / trucking companies, several per role allowed (BE-kt-xnk `add-shipment-service-providers`)
 * @property {ShipmentOperationalDetails} [operationalDetails] - booking / customs facts for the detail page (BE-kt-xnk `add-shipment-operational-details`); missing on older backends
 */

/**
 * @typedef {'Green' | 'Yellow' | 'Red'} ShipmentCustomsChannel
 */

/**
 * Booking / customs details of a shipment, sent and returned as one object
 * (omitted on update = unchanged, BE-kt-xnk).
 * @typedef {Object} ShipmentOperationalDetails
 * @property {string | null} invoiceNumber - "Số hoá đơn TM"
 * @property {string | null} voyageNumber - "Số chuyến"
 * @property {string | null} siCutoff - local date-time "YYYY-MM-DDTHH:mm:ss", "Hạn nộp SI / VGM"
 * @property {string | null} serviceTerm - "CY/CY", "CFS/CY"…
 * @property {boolean} isTransshipment - false = đi thẳng
 * @property {string | null} coForm - "Form D", "Form E"…
 * @property {ShipmentCustomsChannel | null} customsChannel - "Luồng" tờ khai
 * @property {string | null} letterOfCreditNumber - "Số L/C"
 * @property {string | null} [emptyReturnDeadline] - ISO date, "Hạn trả cont rỗng" (end of free time)
 */

/**
 * @typedef {'CargoReady' | 'OriginInland' | 'OriginPort' | 'OnBoard' | 'Ocean' | 'DestinationPort' | 'ImportClearance' | 'DestinationInland' | 'Site' | 'EmptyReturn'} ShipmentMilestone
 */

/**
 * One step of a shipment's tracking journey, resolved by the backend from
 * the contract's Incoterm flow, the status and hand confirmations
 * (BE-kt-xnk `add-shipment-journey-tracking`).
 * @typedef {Object} ShipmentJourneyStep
 * @property {ShipmentMilestone} milestone
 * @property {string} label
 * @property {'Seller' | 'Buyer'} scope
 * @property {'Risk' | 'Freight' | 'Delivery' | 'Completion' | null} marker
 * @property {'Done' | 'Current' | 'Upcoming'} state
 * @property {string | null} completedOn - ISO date (confirmed step, or last empty return)
 * @property {boolean} isConfirmed - confirmed by hand
 * @property {string | null} note
 */

/**
 * @typedef {Object} ShipmentEmptyReturnProgress
 * @property {number} containerCount
 * @property {number} returnedCount
 * @property {string | null} deadline
 * @property {string | null} lastReturnedOn
 * @property {number} overdueDays
 * @property {boolean} isComplete
 */

/**
 * @typedef {Object} ShipmentJourney
 * @property {string} incoterm
 * @property {string} summary
 * @property {ShipmentJourneyStep[]} steps
 * @property {ShipmentEmptyReturnProgress | null} emptyReturn - CIF only
 */

/**
 * @typedef {'CustomsBroker' | 'Trucking'} ShipmentServiceRole
 */

/**
 * One supplier doing one service task on a shipment.
 * @typedef {Object} ShipmentServiceProvider
 * @property {ShipmentServiceRole} role
 * @property {string} supplierId
 */

/**
 * @typedef {Object} ShipmentFormValues
 * @property {string} supplierCustomerId
 * @property {string[]} customsBrokerIds - "Đại lý hải quan", several allowed
 * @property {string[]} truckingIds - "Đơn vị trucking", several allowed
 * @property {string} bookingNumber
 * @property {string} billOfLadingNumber
 * @property {string} shippingLine
 * @property {string} vesselName
 * @property {string} etd
 * @property {string} eta
 * @property {string} placeOfLoading
 * @property {string} placeOfDischarge
 * @property {ShipmentType | ''} type
 * @property {string} name
 * @property {PaymentType | ''} paymentCondition
 * @property {number | undefined} invoiceValue
 * @property {string} invoiceCurrency
 * @property {number | undefined} declarationValue
 * @property {string} declarationCurrency
 * @property {number | undefined} declarationExchangeRate
 * @property {number | undefined} quantityAmount
 * @property {number | undefined} declarationWeightKg
 * @property {string} coNumber
 * @property {string} coDeclarationDate
 * @property {string} coIssuedDate
 * @property {string} customsDeclarationNumber
 * @property {string} customsDeclarationDate
 * @property {boolean} customsInspected
 * @property {ShipmentStatus | ''} status
 * @property {string} invoiceNumber
 * @property {string} voyageNumber
 * @property {string} siCutoffDate - ISO date part of `siCutoff`
 * @property {string} siCutoffTime - "HH:mm" part of `siCutoff`
 * @property {string} serviceTerm
 * @property {boolean} isTransshipment
 * @property {string} coForm
 * @property {ShipmentCustomsChannel | ''} customsChannel
 * @property {string} letterOfCreditNumber
 * @property {string} emptyReturnDeadline
 */

/**
 * @typedef {'Size20' | 'Size40' | 'Size40HC' | 'Size45'} ShipmentContainerType
 */

/**
 * VGM ("Verified Gross Mass") record for one container in a `Shipment` —
 * a shipment has one or more containers, so it has one or more of these
 * (1:N). Unlike every other child entity in this feature, VGM records
 * support delete (BE-kt-xnk). `sequenceNumber` is backend-assigned,
 * purely for stable ordering — `containerNumber` is already the natural
 * human-facing identifier, so there is no computed "code" the way
 * `Shipment.shipmentCode` works. `grossWeight`/`vgm` are computed by the
 * backend from the record's own fields (`grossWeight = netWeight +
 * packagingWeight`, `vgm = grossWeight + tare`) and never editable.
 * @typedef {Object} ShipmentVgm
 * @property {string} id
 * @property {string} shipmentId
 * @property {number} sequenceNumber
 * @property {string} containerNumber
 * @property {string} sealNumber
 * @property {ShipmentContainerType} containerType
 * @property {number} tare
 * @property {number} payload
 * @property {number} maxGross
 * @property {number} netWeight
 * @property {number} packagingWeight
 * @property {number} grossWeight
 * @property {number} vgm
 * @property {string} packingDate
 * @property {string | null} plannedPackingTime
 * @property {string | null} actualPackingTime
 * @property {string | null} truckArrivalTime
 * @property {string} carrierCustomerId
 * @property {string | null} note
 * @property {string | null} [emptyReturnedOn] - ISO date the empty container went back; null = not yet
 * @property {string | null} [emptyReturnDepot]
 */

/**
 * @typedef {Object} ShipmentVgmFormValues
 * @property {string} containerNumber
 * @property {string} sealNumber
 * @property {ShipmentContainerType | ''} containerType
 * @property {number | undefined} tare
 * @property {number | undefined} payload
 * @property {number | undefined} maxGross
 * @property {number | undefined} netWeight
 * @property {number | undefined} packagingWeight
 * @property {string} packingDate
 * @property {string} plannedPackingTime
 * @property {string} actualPackingTime
 * @property {string} truckArrivalTime
 * @property {string} carrierCustomerId
 * @property {string} note
 */
