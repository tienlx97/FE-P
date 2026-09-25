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
 * @param {{ customerCode?: string }} params
 * @returns {BreadcrumbTrail}
 */
export function customerTrail({ customerCode }) {
  return {
    items: [LOGISTICS, CUSTOMERS, { label: customerCode ?? '…' }],
    fallbackHref: CUSTOMERS.href,
  };
}
