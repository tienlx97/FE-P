/**
 * A `Contract` may only have a new `Shipment` created against it when it
 * is Chính thức (Official), signed by both parties, and Đang thực hiện
 * (InProgress) — mirrors the backend's `CreateShipmentCommandHandler`
 * business rule (BE-kt-xnk, 2026-09-15: tightened from "not Cancelled" to
 * "must be InProgress", so NotStarted/Completed are now also ineligible,
 * not just Cancelled). Editing an existing shipment is not subject to this
 * rule — only used to gate contract *selection* when creating a new one.
 * @param {import('../types/index.js').Contract} contract
 */
export function isContractEligibleForShipment(contract) {
  return (
    contract.contractType === 'Official' &&
    contract.sellerSigned &&
    contract.buyerSigned &&
    contract.status === 'InProgress'
  );
}

/**
 * Vietnamese reason `contract` fails {@link isContractEligibleForShipment},
 * or `null` if it's eligible — for a disabled option's tooltip / a
 * disabled button's hint text.
 * @param {import('../types/index.js').Contract} contract
 * @returns {string | null}
 */
export function reasonContractIneligibleForShipment(contract) {
  if (contract.contractType !== 'Official') {
    return 'Hợp đồng phải ở trạng thái Chính thức';
  }
  if (!contract.sellerSigned || !contract.buyerSigned) {
    return 'Hợp đồng phải được ký bởi cả hai bên';
  }
  if (contract.status !== 'InProgress') {
    return 'Hợp đồng phải ở trạng thái Đang thực hiện mới tạo được lần xuất hàng mới';
  }
  return null;
}
