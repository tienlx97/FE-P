import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_GET_ERROR = 'Không thể tải Thông tin private';
const GENERIC_UPSERT_ERROR = 'Không thể lưu Thông tin private';

/**
 * Unlike `getCommission`, a `404` here is a real error (the contract
 * itself doesn't exist) — the endpoint returns `200` with every field
 * `null` once the contract exists but has no private info entered yet
 * (see `docs/api/Contracts.md`, BE-kt-xnk). A `403` means the caller
 * lacks `logistics:secret` — folds into the generic error message like
 * any other forbidden action (`apiRequest`'s own 403 handling), not
 * special-cased here.
 * @param {string} contractId
 * @returns {Promise<{ success: true, privateInfo: import('../types/index.js').ContractPrivateInfo } | { success: false, message: string }>}
 */
export async function getContractPrivateInfo(contractId) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/private-info`,
    { errorMessage: GENERIC_GET_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, privateInfo: result.data };
}

/**
 * Create-or-replace — the client always resends every field, same
 * convention as `updateContract`'s Seller/Buyer/PaymentTerms.
 * @param {string} contractId
 * @param {import('../types/index.js').ContractPrivateInfoFormValues} values
 * @param {import('../types/index.js').ExtraFieldRow[]} [extraFieldRows]
 * @returns {Promise<{ success: true, privateInfo: import('../types/index.js').ContractPrivateInfo } | { success: false, message: string }>}
 */
export async function upsertContractPrivateInfo(
  contractId,
  values,
  extraFieldRows = [],
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
    return { success: false, message: result.message };
  }

  return { success: true, privateInfo: result.data };
}
