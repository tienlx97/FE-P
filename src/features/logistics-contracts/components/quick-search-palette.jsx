'use client';

import {
  CommandPalette,
  CommandPaletteFooter,
  CommandPaletteInput,
  useCommandPaletteContext,
} from '@astryxdesign/core/CommandPalette';
import { useHotkeys } from '@astryxdesign/core/hooks';
import { Icon } from '@astryxdesign/core/Icon';
import { Kbd } from '@astryxdesign/core/Kbd';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Building2, FileText, Ship } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { searchCustomers } from '../api/customers.js';
import { quickSearch } from '../api/quick-search.js';
import { labelForContractStatus } from '../config/contract-status.js';
import {
  contractDetailHref,
  shipmentDetailHref,
} from '../config/quick-search.js';
import { labelForShipmentStatus } from '../config/shipment-status.js';

const SEARCH_DEBOUNCE_MS = 200;
const CONTRACT_GROUP = 'Hợp đồng';
const SHIPMENT_GROUP = 'Lô hàng';
const ACCOUNTING_GROUP = 'Hợp đồng Kế toán';
const CUSTOMER_GROUP = 'Khách hàng';
const CUSTOMER_LIMIT = 5;

/**
 * @typedef {import('@astryxdesign/core/Typeahead').SearchableItem<{
 *   group: string,
 *   kind: 'contract' | 'shipment' | 'customer',
 *   detail: string,
 * }>} QuickSearchItem
 */

/**
 * Bookings not issued yet are saved as `-`.
 * @param {string | null | undefined} value
 */
function hasValue(value) {
  return Boolean(value && value.trim() && value.trim() !== '-');
}

/**
 * @param {import('../api/quick-search.js').QuickSearchResult} result
 * @returns {QuickSearchItem[]}
 */
function toItems({ contracts, shipments }) {
  return [
    ...contracts.map((contract) => ({
      id: contractDetailHref(contract.id),
      label: contract.contractNumber,
      auxiliaryData: {
        group: CONTRACT_GROUP,
        kind: /** @type {const} */ ('contract'),
        detail: [
          contract.buyer?.companyName,
          contract.projectName,
          labelForContractStatus(contract.status),
        ]
          .filter(Boolean)
          .join(' · '),
      },
    })),
    ...shipments.map((shipment) => ({
      id: shipmentDetailHref(shipment.contractId, shipment.id),
      label: shipment.shipmentCode,
      auxiliaryData: {
        group: SHIPMENT_GROUP,
        kind: /** @type {const} */ ('shipment'),
        detail: [
          shipment.name,
          hasValue(shipment.bookingNumber) &&
            `Booking ${shipment.bookingNumber}`,
          labelForShipmentStatus(shipment.status),
        ]
          .filter(Boolean)
          .join(' · '),
      },
    })),
  ];
}

/**
 * Kế toán contracts (by project code or number) as palette items.
 * @param {{ id: string, contractNumber: string, projectCode: string, projectName: string, customerName: string | null }[]} contracts
 * @returns {QuickSearchItem[]}
 */
function toAccountingItems(contracts) {
  return contracts.map((contract) => ({
    id: `/accounting/contract/${contract.id}`,
    label: contract.contractNumber,
    auxiliaryData: {
      group: ACCOUNTING_GROUP,
      kind: /** @type {const} */ ('contract'),
      detail: [
        `Mã công trình ${contract.projectCode}`,
        contract.projectName,
        contract.customerName,
      ]
        .filter(Boolean)
        .join(' · '),
    },
  }));
}

/**
 * Customers (by company name) as palette items, linking to the detail page
 * of the area the user can open.
 * @param {import('../types/index.js').Customer[]} customers
 * @param {string} basePath
 * @returns {QuickSearchItem[]}
 */
function toCustomerItems(customers, basePath) {
  return customers.map((customer) => ({
    id: `${basePath}/${customer.id}`,
    label: customer.companyName,
    auxiliaryData: {
      group: CUSTOMER_GROUP,
      kind: /** @type {const} */ ('customer'),
      detail: [
        customer.profile?.code,
        customer.profile?.taxCode && `MST ${customer.profile.taxCode}`,
      ]
        .filter(Boolean)
        .join(' · '),
    },
  }));
}

/**
 * `CommandPaletteInput` that highlights the first result whenever a new
 * result set arrives — the palette itself starts with nothing highlighted,
 * so Enter right after typing a code would do nothing.
 */
function QuickSearchInput() {
  const palette = useCommandPaletteContext();
  const searchResults = palette?.searchResults;
  const setHighlightedIndex = palette?.setHighlightedIndex;

  useEffect(() => {
    if (searchResults?.length) {
      setHighlightedIndex?.(0);
    }
  }, [searchResults, setHighlightedIndex]);

  return (
    <CommandPaletteInput
      label="Tra cứu nhanh"
      placeholder="Tra cứu nhanh hợp đồng, mã công trình, lô hàng, khách hàng…"
    />
  );
}

/**
 * "Tra cứu nhanh": Ctrl + K (⌘ + K on macOS), from any page and even
 * while typing, opens a palette that finds contracts by number and
 * shipments by code (`26KCT14`, `26kct14/lot-1` — see
 * `config/quick-search.js`); Enter opens the highlighted one's detail
 * page. Also finds Kế toán contracts by project code or number and
 * customers by company name. Mounted once in the protected layout, for users
 * who can view Logistics or Kế toán contracts; each part needs its own
 * permission. `searchAccountingContracts` is passed in by the layout (a
 * feature may not import another).
 * @param {{
 *   canLogistics?: boolean,
 *   canAccounting?: boolean,
 *   searchAccountingContracts?: (query: string) => Promise<Parameters<typeof toAccountingItems>[0]>,
 * }} props
 */
export function QuickSearchPalette({
  canLogistics = true,
  canAccounting = false,
  searchAccountingContracts,
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys([
    {
      keys: 'mod+k',
      allowInInputs: true,
      onPress: () => setIsOpen((open) => !open),
    },
  ]);

  /** @type {import('@astryxdesign/core/Typeahead').SearchSource<QuickSearchItem>} */
  const searchSource = useMemo(() => {
    let latest = 0;

    return {
      async search(query) {
        const version = ++latest;
        await new Promise((resolve) => {
          setTimeout(resolve, SEARCH_DEBOUNCE_MS);
        });
        if (version !== latest) {
          return [];
        }
        const term = query.trim();
        // A "/" is a shipment code: contracts / customers are not asked.
        const isPlainTerm = term !== '' && !term.includes('/');
        const [logistics, accounting, customers] = await Promise.all([
          canLogistics
            ? quickSearch(query)
            : { contracts: [], shipments: [], isLotQuery: false },
          canAccounting && isPlainTerm && searchAccountingContracts
            ? searchAccountingContracts(term).catch(() => [])
            : [],
          isPlainTerm
            ? searchCustomers({
                pageSize: CUSTOMER_LIMIT,
                conditions: [
                  {
                    id: 'quick-search-customer',
                    field: 'companyName',
                    operator: 'Contains',
                    value: term,
                    connector: /** @type {const} */ ('And'),
                  },
                ],
              }).then((result) => (result.success ? result.customers : []))
            : [],
        ]);
        if (version !== latest) {
          return [];
        }
        return [
          ...toItems(logistics),
          ...toAccountingItems(accounting),
          ...toCustomerItems(
            customers,
            canLogistics ? '/logistics/customers' : '/accounting/customers',
          ),
        ];
      },
      bootstrap() {
        return [];
      },
      cancel() {
        latest++;
      },
    };
  }, [canLogistics, canAccounting, searchAccountingContracts]);

  return (
    <CommandPalette
      emptyBootstrapText="Nhập số hợp đồng (26KCT14), mã công trình, mã lô hàng (26KCT14/LOT-01) hoặc tên khách hàng"
      emptySearchText="Không tìm thấy hợp đồng, lô hàng hay khách hàng nào"
      footer={
        <CommandPaletteFooter>
          <Kbd keys="enter" /> mở chi tiết · <Kbd keys="escape" /> đóng ·{' '}
          <Kbd keys="mod+k" /> bật / tắt
        </CommandPaletteFooter>
      }
      input={<QuickSearchInput />}
      isOpen={isOpen}
      label="Tra cứu nhanh"
      onOpenChange={setIsOpen}
      onValueChange={(href) => {
        if (href) {
          router.push(href);
        }
      }}
      renderItem={(/** @type {QuickSearchItem} */ item) => (
        <>
          <Icon
            icon={
              item.auxiliaryData?.kind === 'shipment'
                ? Ship
                : item.auxiliaryData?.kind === 'customer'
                  ? Building2
                  : FileText
            }
            size="sm"
          />
          <VStack gap={0}>
            <Text type="body" weight="semibold">
              {item.label}
            </Text>
            {item.auxiliaryData?.detail ? (
              <Text color="secondary" type="supporting">
                {item.auxiliaryData.detail}
              </Text>
            ) : null}
          </VStack>
        </>
      )}
      searchSource={searchSource}
    />
  );
}
