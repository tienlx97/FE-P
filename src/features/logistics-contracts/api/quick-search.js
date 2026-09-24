import {
  matchesLotSuffix,
  parseQuickSearchQuery,
  QUICK_SEARCH_CONTRACT_LIMIT,
  QUICK_SEARCH_SHIPMENT_LIMIT,
  rankExactFirst,
} from '../config/quick-search.js';
import { searchContracts } from './contracts.js';
import { searchAllShipments } from './shipments.js';

/**
 * A lot suffix is matched here, not by the backend (the shipment code is
 * computed at read time, so `/shipments/search` has no filter for it) —
 * fetch enough of the contract's shipments to find it.
 */
const SHIPMENT_PAGE_SIZE_FOR_LOT = 100;

/**
 * @typedef {{
 *   contracts: import('../types/index.js').Contract[],
 *   shipments: import('../types/index.js').Shipment[],
 *   isLotQuery: boolean,
 * }} QuickSearchResult
 */

/**
 * "Tra cứu nhanh": contracts by number and shipments by code, through the
 * existing `POST /contracts/search` / `POST /shipments/search`
 * (`contractNumber Contains …`). A query with a `/` is about a shipment,
 * so contracts are skipped. A failed side comes back empty rather than
 * failing the other.
 * @param {string} query
 * @returns {Promise<QuickSearchResult>}
 */
export async function quickSearch(query) {
  const parsed = parseQuickSearchQuery(query);
  if (!parsed) {
    return { contracts: [], shipments: [], isLotQuery: false };
  }

  const isLotQuery = parsed.lot !== null;
  const conditions = [
    {
      id: 'quick-search',
      field: 'contractNumber',
      operator: 'Contains',
      value: parsed.contractTerm,
      connector: /** @type {'And'} */ ('And'),
    },
  ];

  const [contractsResult, shipmentsResult] = await Promise.all([
    isLotQuery
      ? null
      : searchContracts({ pageSize: QUICK_SEARCH_CONTRACT_LIMIT, conditions }),
    searchAllShipments({
      pageSize: isLotQuery
        ? SHIPMENT_PAGE_SIZE_FOR_LOT
        : QUICK_SEARCH_SHIPMENT_LIMIT,
      conditions,
    }),
  ]);

  const contracts = contractsResult?.success ? contractsResult.contracts : [];
  const shipments = shipmentsResult.success
    ? shipmentsResult.shipments.filter((shipment) =>
        matchesLotSuffix(shipment.shipmentCode, parsed.lot),
      )
    : [];

  return {
    contracts: rankExactFirst(
      contracts,
      (contract) => contract.contractNumber,
      parsed.contractTerm,
    ),
    shipments: rankExactFirst(
      shipments,
      (shipment) =>
        shipment.shipmentCode.slice(0, shipment.shipmentCode.lastIndexOf('/')),
      parsed.contractTerm,
    ).slice(0, QUICK_SEARCH_SHIPMENT_LIMIT),
    isLotQuery,
  };
}
