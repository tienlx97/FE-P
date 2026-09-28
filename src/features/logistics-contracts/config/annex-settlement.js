/**
 * Annex ("phụ lục") contribution to a settlement value — shared by the
 * contract settlement ("Giá trị quyết toán") and the commission settlement
 * ("Hoa hồng quyết toán"). An annex only counts once both parties have
 * signed it: `AmountIncrease` adds its `amount`, `AmountDecrease` subtracts
 * it, and the non-monetary type (`ValueChange` / `InfoChange`) never counts.
 * Same rule as the backend's `ContractAnnex.SettlementAdjustment`
 * (BE-kt-xnk), which feeds the contract list's `settlementValue`.
 */

/** @param {import('../types/index.js').ContractAnnex} annex */
export function isContractAnnexFullySigned(annex) {
  return annex.sellerSigned && annex.buyerSigned;
}

/** @param {import('../types/index.js').CommissionAnnex} annex */
export function isCommissionAnnexFullySigned(annex) {
  return annex.sellerSigned && annex.partySigned;
}

/** @param {{ type: string, amount: number }} annex */
function signedAmount(annex) {
  if (annex.type === 'AmountIncrease') return annex.amount;
  if (annex.type === 'AmountDecrease') return -annex.amount;
  return 0;
}

/**
 * Signed amount the annex adds to the contract settlement — 0 until both
 * the seller and the buyer have signed.
 * @param {import('../types/index.js').ContractAnnex} annex
 */
export function contractAnnexAdjustment(annex) {
  return isContractAnnexFullySigned(annex) ? signedAmount(annex) : 0;
}

/**
 * Signed amount the annex adds to the commission settlement — 0 until both
 * the seller and the commission party have signed.
 * @param {import('../types/index.js').CommissionAnnex} annex
 */
export function commissionAnnexAdjustment(annex) {
  return isCommissionAnnexFullySigned(annex) ? signedAmount(annex) : 0;
}

/** @param {import('../types/index.js').ContractAnnex[]} annexes */
export function sumContractAnnexAdjustments(annexes) {
  return annexes.reduce(
    (total, annex) => total + contractAnnexAdjustment(annex),
    0,
  );
}

/** @param {import('../types/index.js').CommissionAnnex[]} annexes */
export function sumCommissionAnnexAdjustments(annexes) {
  return annexes.reduce(
    (total, annex) => total + commissionAnnexAdjustment(annex),
    0,
  );
}
