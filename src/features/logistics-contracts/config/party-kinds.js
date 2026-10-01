/**
 * How a Consignee / Notify Party is written on the B/L — mirrors BE-P's
 * `PartyKind` / `PartyKindRules` (`docs/api/Contracts.md` "Kiểu bên nhận").
 * `''` in the form means "no party" (sent as `null`).
 */

/** @type {{ value: import('../types/index.js').PartyKind, label: string }[]} */
export const consigneeKindOptions = [
  { value: 'Named', label: 'Công ty cụ thể' },
  { value: 'ToOrder', label: 'TO ORDER' },
  { value: 'ToOrderOfShipper', label: 'TO ORDER OF SHIPPER' },
  { value: 'ToOrderOfBank', label: 'TO ORDER OF <ngân hàng>' },
];

/** @type {{ value: import('../types/index.js').PartyKind, label: string }[]} */
export const notifyPartyKindOptions = [
  { value: 'Named', label: 'Công ty cụ thể' },
  { value: 'SameAsConsignee', label: 'SAME AS CONSIGNEE' },
];

/** Named needs the company, ToOrderOfBank the bank; the rest are fixed
 * wording. @param {import('../types/index.js').PartyKind | ''} kind */
export function partyKindNeedsName(kind) {
  return kind === 'Named' || kind === 'ToOrderOfBank';
}

/** @param {import('../types/index.js').PartyKind | ''} kind */
export function partyNameLabel(kind) {
  return kind === 'ToOrderOfBank' ? 'Ngân hàng' : 'Tên công ty';
}

/** @returns {import('../types/index.js').PartyFormValue} */
export function emptyPartyFormValue() {
  return {
    kind: '',
    name: '',
    address: '',
    sourceContactId: '',
    loadedName: '',
    extraFields: [],
  };
}

/**
 * @param {import('../types/index.js').ContractPartyContact | null | undefined} party
 * @returns {import('../types/index.js').PartyFormValue}
 */
export function partyFormValueFrom(party) {
  if (!party) return emptyPartyFormValue();
  return {
    kind: party.kind ?? 'Named',
    name: party.name ?? '',
    address: party.address ?? '',
    sourceContactId: party.sourceContactId ?? '',
    loadedName: party.name ?? '',
    extraFields: party.extraFields ?? [],
  };
}

/**
 * Wire shape (`PartyContactRequest`). The catalog link is kept only while
 * the name is the one it was loaded with — the backend pins a linked
 * party's name to the catalog, so a renamed party is sent inline. Extra
 * fields are not edited here and go back unchanged.
 * @param {import('../types/index.js').PartyFormValue} party
 */
export function partyPayload(party) {
  if (!party.kind) return null;
  const hasName = partyKindNeedsName(party.kind);
  const name = hasName ? party.name.trim() : '';
  const keepsLink =
    party.kind === 'Named' &&
    Boolean(party.sourceContactId) &&
    name === party.loadedName.trim();
  return {
    Kind: party.kind,
    SourceContactId: keepsLink ? party.sourceContactId : null,
    Name: name || null,
    Address: party.address.trim() || null,
    ExtraFields: party.extraFields.map((field) => ({
      Key: field.key,
      Value: field.value,
    })),
  };
}

/** @type {{ value: import('../types/index.js').PaymentMethod, label: string }[]} */
export const paymentMethodOptions = [
  { value: 'TT', label: 'T/T' },
  { value: 'LC', label: 'L/C' },
];

/** "T/T" / "L/C"; empty for a term without a stored type (commission).
 * @param {import('../types/index.js').PaymentMethod | null | undefined} type */
export function labelForPaymentMethod(type) {
  return (
    paymentMethodOptions.find((option) => option.value === type)?.label ?? ''
  );
}

/** One payment term as "30% L/C · <condition>".
 * @param {import('../types/index.js').PaymentTerm} term */
export function describePaymentTerm(term) {
  const method = labelForPaymentMethod(term.paymentType);
  return [`${term.paymentRatioPercent}%`, method, term.paymentCondition]
    .filter(Boolean)
    .join(' ');
}
