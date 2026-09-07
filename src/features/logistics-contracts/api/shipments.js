import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách lần xuất hàng';
const GENERIC_LIST_ALL_ERROR = 'Không thể tải danh sách Shipment';
const GENERIC_CREATE_ERROR = 'Không thể thêm lần xuất hàng';
const GENERIC_UPDATE_ERROR = 'Không thể cập nhật lần xuất hàng';

/**
 * `Costs` is sent as the full list on both create and update (whole-list
 * replace, same contract as `Commission.PaymentHistory`/`PaymentTerms` —
 * see `docs/api/Shipments.md`, BE-kt-xnk).
 * @param {import('../types/index.js').ShipmentCostLine[] | import('../types/index.js').ShipmentCostLineFormValues[]} costLines
 */
function toCostsRequestBody(costLines) {
  return costLines.map((cost) => ({
    CostCategoryId: cost.costCategoryId,
    Name: cost.name,
    Amount: cost.amount,
    Note: cost.note || null,
    ProviderCustomerId: cost.providerCustomerId || null,
  }));
}

/**
 * `QuantityUnit` is derived from `Type` on the backend now (LCL is always
 * Kiện, FCL always Cont) — never sent, on create or update.
 * @param {import('../types/index.js').ShipmentFormValues} values
 * @param {import('../types/index.js').ShipmentCostLineFormValues[]} costLines
 */
function toCreateRequestBody(values, costLines) {
  return {
    SupplierCustomerId: values.supplierCustomerId,
    BookingNumber: values.bookingNumber,
    BillOfLadingNumber: values.billOfLadingNumber || null,
    ShippingLine: values.shippingLine || null,
    VesselName: values.vesselName || null,
    Etd: values.etd || null,
    Eta: values.eta || null,
    PlaceOfLoading: values.placeOfLoading || null,
    PlaceOfDischarge: values.placeOfDischarge || null,
    Type: values.type,
    Name: values.name,
    PaymentCondition: values.paymentCondition,
    InvoiceValue: values.invoiceValue,
    InvoiceCurrency: values.invoiceCurrency,
    DeclarationValue: values.declarationValue,
    DeclarationCurrency: values.declarationCurrency,
    DeclarationExchangeRate: values.declarationExchangeRate,
    QuantityAmount: values.quantityAmount,
    DeclarationWeightKg: values.declarationWeightKg,
    CoNumber: values.coNumber || null,
    CoDeclarationDate: values.coDeclarationDate || null,
    CoIssuedDate: values.coIssuedDate || null,
    Costs: toCostsRequestBody(costLines),
    Status: values.status,
  };
}

/**
 * `Type` is immutable after creation (see `Shipment`'s class doc comment,
 * BE-kt-xnk) — not part of the update body either.
 * @param {import('../types/index.js').ShipmentFormValues} values
 * @param {import('../types/index.js').ShipmentCostLineFormValues[]} costLines
 */
function toUpdateRequestBody(values, costLines) {
  return {
    SupplierCustomerId: values.supplierCustomerId,
    BookingNumber: values.bookingNumber,
    BillOfLadingNumber: values.billOfLadingNumber || null,
    ShippingLine: values.shippingLine || null,
    VesselName: values.vesselName || null,
    Etd: values.etd || null,
    Eta: values.eta || null,
    PlaceOfLoading: values.placeOfLoading || null,
    PlaceOfDischarge: values.placeOfDischarge || null,
    Name: values.name,
    PaymentCondition: values.paymentCondition,
    InvoiceValue: values.invoiceValue,
    InvoiceCurrency: values.invoiceCurrency,
    DeclarationValue: values.declarationValue,
    DeclarationCurrency: values.declarationCurrency,
    DeclarationExchangeRate: values.declarationExchangeRate,
    QuantityAmount: values.quantityAmount,
    DeclarationWeightKg: values.declarationWeightKg,
    CoNumber: values.coNumber || null,
    CoDeclarationDate: values.coDeclarationDate || null,
    CoIssuedDate: values.coIssuedDate || null,
    Costs: toCostsRequestBody(costLines),
    Status: values.status,
  };
}

/**
 * Requires `logistics:contracts:view`, scoped to the contract's company.
 * @param {string} contractId
 * @returns {Promise<{ success: true, shipments: import('../types/index.js').Shipment[] } | { success: false, message: string }>}
 */
export async function listShipments(contractId) {
  const result = await apiRequest(`/api/v1/contracts/${contractId}/shipments`, {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, shipments: result.data ?? [] };
}

/**
 * System-wide list across every contract (unlike `listShipments`, not
 * scoped under `/contracts/{contractId}`) — non-Admin callers only see
 * shipments whose parent contract's `CompanyId` they have
 * `logistics:contracts:view` on; Admin sees all. Sorted by the parent
 * contract's `CreatedDate` descending, then `ShipmentNumber` descending
 * (newest first).
 * @param {{ page?: number, pageSize?: number }} [options]
 * @returns {Promise<{ success: true, shipments: import('../types/index.js').Shipment[], page: number, pageSize: number, totalCount: number, totalPages: number } | { success: false, message: string }>}
 */
export async function listAllShipments({ page = 1, pageSize = 25 } = {}) {
  const result = await apiRequest(
    `/api/v1/shipments?page=${page}&pageSize=${pageSize}`,
    { errorMessage: GENERIC_LIST_ALL_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    shipments: result.data?.items ?? [],
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Same as `listAllShipments`, additionally narrowed by `conditions` (the
 * advanced-search condition builder). An empty `conditions` array behaves
 * identically to `listAllShipments` — filtering happens server-side (`POST
 * /api/v1/shipments/search`, BE-kt-xnk).
 * @param {{ page?: number, pageSize?: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[] }} [options]
 * @returns {Promise<{ success: true, shipments: import('../types/index.js').Shipment[], page: number, pageSize: number, totalCount: number, totalPages: number } | { success: false, message: string }>}
 */
export async function searchAllShipments({ page = 1, pageSize = 25, conditions = [] } = {}) {
  const result = await apiRequest('/api/v1/shipments/search', {
    method: 'POST',
    errorMessage: GENERIC_LIST_ALL_ERROR,
    body: {
      Page: page,
      PageSize: pageSize,
      Conditions: conditions.map((condition) => ({
        Field: condition.field,
        Operator: condition.operator,
        Value: condition.value || null,
        ValueTo: condition.valueTo || null,
        Connector: condition.connector,
      })),
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    shipments: result.data?.items ?? [],
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Requires `logistics:contracts:manage`, scoped to the contract's company.
 * `shipmentNumber`/`shipmentCode` are assigned by the backend, never sent
 * here. `costLines` defaults to empty — a shipment may be created with no
 * logistics costs recorded yet.
 * @param {string} contractId
 * @param {import('../types/index.js').ShipmentFormValues} values
 * @param {import('../types/index.js').ShipmentCostLineFormValues[]} [costLines]
 * @returns {Promise<{ success: true, shipment: import('../types/index.js').Shipment } | { success: false, message: string }>}
 */
export async function createShipment(contractId, values, costLines = []) {
  const result = await apiRequest(`/api/v1/contracts/${contractId}/shipments`, {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: toCreateRequestBody(values, costLines),
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, shipment: result.data };
}

/**
 * Requires `logistics:contracts:manage`, scoped to the contract's company.
 * `shipmentNumber` is immutable — not part of the request body. `costLines`
 * is the *entire* list — sending fewer rows than currently exist deletes
 * the rest (same "whole-list replace" contract as
 * `Commission.PaymentHistory`/`PaymentTerms`).
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {import('../types/index.js').ShipmentFormValues} values
 * @param {import('../types/index.js').ShipmentCostLineFormValues[]} [costLines]
 * @returns {Promise<{ success: true, shipment: import('../types/index.js').Shipment } | { success: false, message: string }>}
 */
export async function updateShipment(contractId, shipmentId, values, costLines = []) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/shipments/${shipmentId}`,
    {
      method: 'PUT',
      errorMessage: GENERIC_UPDATE_ERROR,
      body: toUpdateRequestBody(values, costLines),
    },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, shipment: result.data };
}
