import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_GET_ERROR = 'Không thể tải Thông tin private';
const GENERIC_UPSERT_ERROR = 'Không thể lưu Thông tin private';
const GENERIC_LIST_ERROR = 'Không thể tải danh sách BOQ';

/**
 * System-wide "BOQ" list across every contract the caller has
 * `logistics:secret` on (unlike `logistics:contracts:view`, this permission
 * is individually granted, never role/department-derived — see
 * `docs/api/Contracts.md`, BE-kt-xnk). A caller with no `logistics:secret`
 * grant anywhere gets a real 403, folded into the generic error message.
 * @param {{ page?: number, pageSize?: number }} [options]
 * @returns {Promise<{ success: true, items: import('../types/index.js').ContractPrivateInfoListItem[], page: number, pageSize: number, totalCount: number, totalPages: number } | { success: false, message: string, conflict: boolean }>}
 */
export async function listContractPrivateInfos({ page = 1, pageSize = 25 } = {}) {
  const result = await apiRequest(
    `/api/v1/contracts/private-info?page=${page}&pageSize=${pageSize}`,
    { errorMessage: GENERIC_LIST_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return {
    success: true,
    items: result.data?.items ?? [],
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Same as `listContractPrivateInfos`, additionally narrowed by `conditions`
 * (the advanced-search condition builder) — filters the same `Contract`
 * fields as `searchAllContracts`/`searchAllShipments` (contractNumber,
 * projectName, ...), not BOQ-specific fields. An empty `conditions` array
 * behaves identically to `listContractPrivateInfos`.
 * @param {{ page?: number, pageSize?: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[] }} [options]
 * @returns {Promise<{ success: true, items: import('../types/index.js').ContractPrivateInfoListItem[], page: number, pageSize: number, totalCount: number, totalPages: number } | { success: false, message: string, conflict: boolean }>}
 */
export async function searchContractPrivateInfos({
  page = 1,
  pageSize = 25,
  conditions = [],
} = {}) {
  const result = await apiRequest('/api/v1/contracts/private-info/search', {
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
    items: result.data?.items ?? [],
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Unlike `getCommission`, a `404` here is a real error (the contract
 * itself doesn't exist) — the endpoint returns `200` with every field
 * `null` once the contract exists but has no private info entered yet
 * (see `docs/api/Contracts.md`, BE-kt-xnk). A `403` means the caller
 * lacks `logistics:secret` — folds into the generic error message like
 * any other forbidden action (`apiRequest`'s own 403 handling), not
 * special-cased here.
 * @param {string} contractId
 * @returns {Promise<{ success: true, privateInfo: import('../types/index.js').ContractPrivateInfo } | { success: false, message: string, conflict: boolean }>}
 */
export async function getContractPrivateInfo(contractId) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/private-info`,
    { errorMessage: GENERIC_GET_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return { success: true, privateInfo: result.data };
}

/**
 * Create-or-replace — the client always resends every field, same
 * convention as `updateContract`'s Seller/Buyer/PaymentTerms.
 * @param {string} contractId
 * @param {import('../types/index.js').ContractPrivateInfoFormValues} values
 * @param {import('../types/index.js').ExtraFieldRow[]} [extraFieldRows]
 * @param {number} [version]
 * @returns {Promise<{ success: true, privateInfo: import('../types/index.js').ContractPrivateInfo } | { success: false, message: string, conflict: boolean }>}
 */
export async function upsertContractPrivateInfo(
  contractId,
  values,
  extraFieldRows = [],
  version,
) {
  // Same "drop blank-key rows the user never filled in" convention as
  // `buildSellerPayload`/`buildPartyAPayload` (`api/contracts.js`).
  const extraFields = extraFieldRows
    .filter((row) => row.key.trim())
    .map((row) => ({ Key: row.key, Value: row.value }));

  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/private-info`,
    {
      method: 'PUT',
      errorMessage: GENERIC_UPSERT_ERROR,
      body: {
        Version: version,
        BoqSentDate: values.boqSentDate || null,
        ContainerCount: values.containerCount ?? null,
        CostPricePerContainer: values.costPricePerContainer ?? null,
        QuotedPricePerContainer: values.quotedPricePerContainer ?? null,
        UnitCostLabor: values.unitCostLabor ?? null,
        UnitCostSandblasting: values.unitCostSandblasting ?? null,
        UnitCostPainting: values.unitCostPainting ?? null,
        UnitCostFactory: values.unitCostFactory ?? null,
        VolumeSale: values.volumeSale ?? null,
        VolumeMaterial: values.volumeMaterial ?? null,
        Profit: values.profit ?? null,
        TotalAmountUsd: values.totalAmountUsd ?? null,
        ExchangeRateVnd: values.exchangeRateVnd ?? null,
        ExtraFields: extraFields,
      },
    },
  );

  if (!result.success) {
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return { success: true, privateInfo: result.data };
}
