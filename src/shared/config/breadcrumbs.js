/**
 * Breadcrumb trails for the logistics detail pages, in one place so every
 * page shows the same hierarchy (Logistics › list › parent › current) and
 * the back button's fallback is always the page's real parent.
 *
 * Each builder returns `{ items, fallbackHref }`:
 * - `items`: crumbs from the root down; the last one is the current page
 *   (no `href`).
 * - `fallbackHref`: where "Quay lại" goes when there is no in-app history
 *   to go back to (deep link, new tab, reload) — see `useBackNavigation`.
 */

/** @typedef {{ label: string, href?: string }} BreadcrumbTrailItem */
/** @typedef {{ items: BreadcrumbTrailItem[], fallbackHref: string }} BreadcrumbTrail */

const LOGISTICS = { label: 'Logistics', href: '/logistics' };
const CONTRACTS = { label: 'Hợp đồng', href: '/logistics/contracts' };
const SUPPLIERS = { label: 'Nhà cung cấp', href: '/logistics/suppliers' };
const CUSTOMERS = { label: 'Khách hàng', href: '/logistics/customers' };

/** @param {string} contractId @param {string} [tab] */
export function contractHref(contractId, tab) {
  const href = `/logistics/contract/${contractId}`;
  return tab ? `${href}?tab=${tab}` : href;
}

/**
 * @param {{ contractNumber?: string }} params
 * @returns {BreadcrumbTrail}
 */
export function contractTrail({ contractNumber }) {
  return {
    items: [LOGISTICS, CONTRACTS, { label: contractNumber ?? '…' }],
    fallbackHref: CONTRACTS.href,
  };
}

/**
 * @param {{ contractId: string, contractNumber?: string, shipmentCode?: string }} params
 * @returns {BreadcrumbTrail}
 */
export function shipmentTrail({ contractId, contractNumber, shipmentCode }) {
  const parentHref = contractHref(contractId, 'shipments');
  return {
    items: [
      LOGISTICS,
      CONTRACTS,
      { label: contractNumber ?? 'Hợp đồng', href: parentHref },
      { label: shipmentCode ?? '…' },
    ],
    fallbackHref: parentHref,
  };
}

/**
 * @param {{ contractId: string, contractNumber?: string, commissionCode?: string }} params
 * @returns {BreadcrumbTrail}
 */
export function commissionTrail({
  contractId,
  contractNumber,
  commissionCode,
}) {
  const parentHref = contractHref(contractId, 'commission');
  return {
    items: [
      LOGISTICS,
      CONTRACTS,
      { label: contractNumber ?? 'Hợp đồng', href: parentHref },
      { label: commissionCode ?? 'Commission' },
    ],
    fallbackHref: parentHref,
  };
}

/**
 * @param {{ supplierCode?: string }} params
 * @returns {BreadcrumbTrail}
 */
export function supplierTrail({ supplierCode }) {
  return {
    items: [LOGISTICS, SUPPLIERS, { label: supplierCode ?? '…' }],
    fallbackHref: SUPPLIERS.href,
  };
}

/**
 * @param {{ customerCode?: string, area?: 'logistics' | 'accounting' }} params
 * @returns {BreadcrumbTrail}
 */
export function customerTrail({ customerCode, area = 'logistics' }) {
  // The customer directory is shared with Kế toán (BE-P accounting-contracts
  // task 1.7); there the trail is Kế toán › Khách hàng.
  const [root, list] =
    area === 'accounting'
      ? [ACCOUNTING, ACCOUNTING_CUSTOMERS]
      : [LOGISTICS, CUSTOMERS];
  return {
    items: [root, list, { label: customerCode ?? '…' }],
    fallbackHref: list.href,
  };
}

const ACCOUNTING = { label: 'Kế toán', href: '/accounting' };
const ACCOUNTING_CUSTOMERS = {
  label: 'Khách hàng',
  href: '/accounting/customers',
};
const ACCOUNTING_CONTRACTS = {
  label: 'Hợp đồng',
  href: '/accounting/contracts',
};

/**
 * Kế toán contract page: Kế toán › Hợp đồng › {contractNumber}.
 * @param {{ contractNumber?: string }} params
 * @returns {BreadcrumbTrail}
 */
export function accountingContractTrail({ contractNumber }) {
  return {
    items: [ACCOUNTING, ACCOUNTING_CONTRACTS, { label: contractNumber ?? '…' }],
    fallbackHref: ACCOUNTING_CONTRACTS.href,
  };
}
