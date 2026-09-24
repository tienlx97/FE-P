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
import { FileText, Ship } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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

/**
 * @typedef {import('@astryxdesign/core/Typeahead').SearchableItem<{
 *   group: string,
 *   kind: 'contract' | 'shipment',
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
      placeholder="Tra cứu nhanh hợp đồng, lô hàng…"
    />
  );
}

/**
 * "Tra cứu nhanh": Ctrl + K (⌘ + K on macOS), from any page and even
 * while typing, opens a palette that finds contracts by number and
 * shipments by code (`26KCT14`, `26kct14/lot-1` — see
 * `config/quick-search.js`); Enter opens the highlighted one's detail
 * page. Mounted once in the protected layout, only for users who can view
 * contracts.
 */
export function QuickSearchPalette() {
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
        return toItems(await quickSearch(query));
      },
      bootstrap() {
        return [];
      },
      cancel() {
        latest++;
      },
    };
  }, []);

  return (
    <CommandPalette
      emptyBootstrapText="Nhập số hợp đồng (26KCT14) hoặc mã lô hàng (26KCT14/LOT-01)"
      emptySearchText="Không tìm thấy hợp đồng hay lô hàng nào"
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
            icon={item.auxiliaryData?.kind === 'shipment' ? Ship : FileText}
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
