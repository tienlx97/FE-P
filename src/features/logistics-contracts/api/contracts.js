import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách hợp đồng';
const GENERIC_CREATE_ERROR = 'Không thể tạo hợp đồng';
const GENERIC_UPDATE_ERROR = 'Không thể cập nhật hợp đồng';
const GENERIC_EXISTS_ERROR = 'Không thể kiểm tra số hợp đồng';

/**
 * @param {{ page?: number, pageSize?: number }} [options]
 * @returns {Promise<{ success: true, contracts: import('../types/index.js').Contract[], page: number, pageSize: number, totalCount: number, totalPages: number } | { success: false, message: string, conflict: boolean }>}
 */
export async function listContracts({ page = 1, pageSize = 25 } = {}) {
  const result = await apiRequest(
    `/api/v1/contracts?page=${page}&pageSize=${pageSize}`,
    { errorMessage: GENERIC_LIST_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return {
    success: true,
    contracts: result.data?.items ?? [],
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Same as `listContracts`, additionally narrowed by `conditions` (the
 * advanced-search condition builder, `AdvanceTable`'s "Bộ lọc nâng cao"
 * panel). An empty `conditions` array behaves identically to
 * `listContracts` — filtering happens server-side (`POST
 * /api/v1/contracts/search`, BE-kt-xnk) so results are correct across every
 * page, not just the one currently loaded.
 *
 * Unlike `listContracts`, the response is
 * `{ page: {...}, totals: [...], settlements: [...] }` rather than the flat
 * paging envelope:
 * - `totals` sums `contractValue`/`settlementValue`/`paidValue`/
 *   `unpaidValue` per currency across every matching contract (not just
 *   this page) — backs the list's per-column totals row. Grouped by
 *   currency because contracts can be denominated in different currencies;
 *   a single cross-currency sum would be meaningless.
 * - `settlements` has one entry per contract on *this page* (matched by
 *   `contractId`) — `settlementValue` (contract value + annex adjustments),
 *   `paidValue` (sum of recorded payment schedules) and `unpaidValue`
 *   (`settlementValue - paidValue`), backing the list's "Quyết toán / Đã
 *   thanh toán / Chưa thanh toán" columns.
 * @param {{ page?: number, pageSize?: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[] }} [options]
 * @returns {Promise<{ success: true, contracts: import('../types/index.js').Contract[], page: number, pageSize: number, totalCount: number, totalPages: number, totals: { currency: string, contractValue: number, settlementValue: number, paidValue: number, unpaidValue: number }[], settlements: { contractId: string, settlementValue: number, paidValue: number, unpaidValue: number }[] } | { success: false, message: string, conflict: boolean }>}
 */
export async function searchContracts({
  page = 1,
  pageSize = 25,
  conditions = [],
} = {}) {
  const result = await apiRequest('/api/v1/contracts/search', {
    method: 'POST',
    errorMessage: GENERIC_LIST_ERROR,
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
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return {
    success: true,
    contracts: result.data?.page?.items ?? [],
    page: result.data?.page?.page ?? page,
    pageSize: result.data?.page?.pageSize ?? pageSize,
    totalCount: result.data?.page?.totalCount ?? 0,
    totalPages: result.data?.page?.totalPages ?? 0,
    totals: result.data?.totals ?? [],
    settlements: result.data?.settlements ?? [],
  };
}

/**
 * Real-time duplicate check for the "Số hợp đồng" field — backs the Contract
 * form's live validation, separate from the `409 Conflict` the backend still
 * returns on submit (this is a UX aid, not the source of truth).
 * `excludeContractId` lets the edit form check "does any *other* contract
 * use this number" without the contract colliding with its own current
 * number (see `GET /contracts/exists`, `docs/api/Contracts.md`, BE-kt-xnk).
 * @param {{ contractNumber: string, excludeContractId?: string | null }} params
 * @returns {Promise<{ success: true, exists: boolean } | { success: false, message: string, conflict: boolean }>}
 */
export async function checkContractNumberExists({
  contractNumber,
  excludeContractId,
}) {
  const params = new URLSearchParams({ contractNumber });
  if (excludeContractId) {
    params.set('excludeContractId', excludeContractId);
  }

  const result = await apiRequest(
    `/api/v1/contracts/exists?${params.toString()}`,
    {
      errorMessage: GENERIC_EXISTS_ERROR,
    },
  );

  if (!result.success) {
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return { success: true, exists: Boolean(result.data?.exists) };
}

/**
 * Turns the validated form shape into the `Seller` wire object. Same rules
 * as `buildPartyAPayload`: `CompanyName` is only sent when there's no
 * `SourceSellerId`, every other field is always sent from the form (see
 * `docs/api/Contracts.md`, BE-kt-xnk).
 * @param {import('../types/index.js').ContractFormValues} values
 * @param {import('../types/index.js').ExtraFieldRow[]} sellerExtraFieldRows
 */
function buildSellerPayload(values, sellerExtraFieldRows) {
  const extraFields = sellerExtraFieldRows
    .filter((row) => row.key.trim())
    .map((row) => ({ Key: row.key, Value: row.value }));

  return {
    SourceSellerId: values.sourceSellerId || null,
    CompanyName: values.sourceSellerId ? null : values.sellerInline.companyName,
    RepresentativeName: values.sellerInline.representativeName || null,
    RepresentativeTitle: values.sellerInline.representativeTitle || null,
    Address: values.sellerInline.address || null,
    ExtraFields: extraFields,
  };
}

/**
 * Turns the validated form shape into the `Buyer` wire object (renamed from
 * `PartyA` — see `docs/api/Contracts.md`, BE-kt-xnk). `CompanyName` is only
 * sent when there's no `SourceCustomerId` — the backend takes it from the
 * catalog record when linked. Every other field
 * (`RepresentativeName`/`RepresentativeTitle`/`Address`/`ExtraFields`) is
 * always sent from the form, whether or not `SourceCustomerId` is set — the
 * backend persists them per-contract either way, so the same customer can
 * be Buyer on multiple contracts with a different representative on each.
 * @param {import('../types/index.js').ContractFormValues} values
 * @param {import('../types/index.js').ExtraFieldRow[]} buyerExtraFieldRows
 */
function buildBuyerPayload(values, buyerExtraFieldRows) {
  const extraFields = buyerExtraFieldRows
    .filter((row) => row.key.trim())
    .map((row) => ({ Key: row.key, Value: row.value }));

  return {
    SourceCustomerId: values.sourceCustomerId || null,
    CompanyName: values.sourceCustomerId
      ? null
      : values.buyerInline.companyName,
    RepresentativeName: values.buyerInline.representativeName || null,
    RepresentativeTitle: values.buyerInline.representativeTitle || null,
    Address: values.buyerInline.address || null,
    ExtraFields: extraFields,
  };
}

/**
 * @param {import('../types/index.js').ContractFormValues} values
 * @param {{ paymentTerms: { paymentRatioPercent: number, paymentCondition: string }[], version?: number, sellerExtraFieldRows?: import('../types/index.js').ExtraFieldRow[], buyerExtraFieldRows?: import('../types/index.js').ExtraFieldRow[] }} extra
 */
function buildContractBody(
  values,
  { paymentTerms, sellerExtraFieldRows = [], buyerExtraFieldRows = [] },
) {
  return {
    ContractNumber: values.contractNumber,
    ContractType: values.contractType,
    CreatedDate: values.createdDate,
    QuotationDate: values.quotationDate,
    ProjectName: values.projectName,
    Category: values.category,
    CountryId: values.countryId,
    PlaceOfLoading: values.placeOfLoading,
    // '' for FOB/EXW (no destination leg) — see
    // `requiresPlaceOfDischarge()`, `config/incoterms.js`.
    PlaceOfDischarge: values.placeOfDischarge || null,
    ContractValue: values.contractValue,
    Currency: values.currency,
    Incoterm: values.incoterm,
    IncotermYear: values.incotermYear,
    Seller: buildSellerPayload(values, sellerExtraFieldRows),
    Buyer: buildBuyerPayload(values, buyerExtraFieldRows),
    NotifyParty: null,
    Consignee: null,
    Note: values.note || null,
    PaymentTerms: paymentTerms.map((term) => ({
      PaymentRatioPercent: term.paymentRatioPercent,
      PaymentCondition: term.paymentCondition,
    })),
    BankIds: values.bankIds,
    SellerSigned: values.sellerSigned,
    BuyerSigned: values.buyerSigned,
    Status: values.status,
  };
}

/**
 * @param {import('../types/index.js').ContractFormValues} values
 * @param {{ paymentTerms: { paymentRatioPercent: number, paymentCondition: string }[], version?: number, sellerExtraFieldRows?: import('../types/index.js').ExtraFieldRow[], buyerExtraFieldRows?: import('../types/index.js').ExtraFieldRow[] }} extra
 * @returns {Promise<{ success: true, contract: import('../types/index.js').Contract } | { success: false, message: string, conflict: boolean }>}
 */
export async function createContract(values, extra) {
  const result = await apiRequest('/api/v1/contracts', {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: {
      ...buildContractBody(values, extra),
      CompanyId: values.companyId,
    },
  });

  if (!result.success) {
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return { success: true, contract: result.data };
}

/**
 * @param {string} contractId
 * @param {import('../types/index.js').ContractFormValues} values
 * @param {{ paymentTerms: { paymentRatioPercent: number, paymentCondition: string }[], version?: number, sellerExtraFieldRows?: import('../types/index.js').ExtraFieldRow[], buyerExtraFieldRows?: import('../types/index.js').ExtraFieldRow[] }} extra
 * @returns {Promise<{ success: true, contract: import('../types/index.js').Contract } | { success: false, message: string, conflict: boolean }>}
 */
export async function updateContract(contractId, values, extra) {
  const result = await apiRequest(`/api/v1/contracts/${contractId}`, {
    method: 'PUT',
    errorMessage: GENERIC_UPDATE_ERROR,
    body: { ...buildContractBody(values, extra), Version: extra.version },
  });

  if (!result.success) {
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return { success: true, contract: result.data };
}
