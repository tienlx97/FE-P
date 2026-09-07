'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';

import { QuickCreateSellerDialog } from './quick-create-seller-dialog.jsx';
import { SellerFields } from './seller-fields.jsx';

/**
 * Seller (bên bán) must reference an existing `Seller` from the catalog
 * (snapshotted into the contract on save — see `docs/api/Contracts.md`,
 * BE-kt-xnk): pick one from the Selector, or "Thêm bên bán" to create one on
 * the spot (auto-selected once created). Mirrors `BuyerFields` — picking a
 * seller prefills representative/title/address/extra fields from its
 * current catalog record, but those stay **editable** — the backend only
 * pins `CompanyName` to the catalog when `SourceSellerId` is set.
 * @param {{
 *   sellers: import('../types/index.js').Seller[],
 *   sourceSellerId: string,
 *   inlineValues: import('../types/index.js').SellerFormValues,
 *   sourceSellerIdStatus?: { type: 'error' | 'success', message: string },
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   onSelectExisting: (sellerId: string, knownSeller?: import('../types/index.js').Seller) => void,
 *   onSwitchToInline: () => void,
 *   onInlineFieldChange: (field: keyof import('../types/index.js').SellerFormValues, value: string) => void,
 *   extraFieldRows: ReturnType<typeof import('../hooks/use-extra-field-rows.js').useExtraFieldRows>,
 *   isReadOnly?: boolean,
 * }} props
 */
export function SellerPickerFields({
  sellers,
  sourceSellerId,
  inlineValues,
  sourceSellerIdStatus,
  fieldStatuses,
  onSelectExisting,
  onSwitchToInline,
  onInlineFieldChange,
  extraFieldRows,
  isReadOnly = false,
}) {
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const selectedSeller = sellers.find((seller) => seller.id === sourceSellerId);

  return (
    <VStack gap={3} hAlign="stretch">
      <HStack gap={2} vAlign="end">
        <StackItem size="fill">
          <Selector
            isDisabled={isReadOnly}
            label="Bên bán"
            hasSearch
            placeholder="Chọn bên bán"
            value={sourceSellerId}
            onChange={(value) =>
              value ? onSelectExisting(value) : onSwitchToInline()
            }
            options={sellers.map((seller) => ({
              value: seller.id,
              label: seller.companyName,
            }))}
            isRequired
            status={sourceSellerIdStatus}
            statusVariant="tooltip"
            width="100%"
          />
        </StackItem>
        <IconButton
          isDisabled={isReadOnly}
          label="Thêm bên bán"
          tooltip="Thêm bên bán"
          icon={<Icon icon={IconPlus} size="sm" />}
          type="button"
          variant="secondary"
          onClick={() => setIsQuickCreateOpen(true)}
        />
      </HStack>

      {selectedSeller ? (
        <VStack gap={3} hAlign="stretch">
          <Text type="supporting" color="secondary">
            Tên công ty: {selectedSeller.companyName} (theo danh mục, không sửa
            được ở đây)
          </Text>
        </VStack>
      ) : inlineValues.companyName ? (
        // Editing a contract whose Seller was saved without a catalog link
        // (a typed CompanyName, no SourceSellerId — the backend still
        // allows that, this form just no longer offers it going forward).
        <Text type="supporting" color="secondary">
          Tên công ty hiện tại (chưa gắn danh mục): {inlineValues.companyName}.
          Chọn bên bán tương ứng ở trên, hoặc &quot;Thêm bên bán&quot; nếu chưa
          có trong danh mục.
        </Text>
      ) : null}

      <SellerFields
        values={inlineValues}
        setField={onInlineFieldChange}
        fieldStatuses={fieldStatuses}
        extraFieldRows={extraFieldRows}
        showCompanyName={false}
        isCollapsible
        isReadOnly={isReadOnly}
      />

      <QuickCreateSellerDialog
        isOpen={isQuickCreateOpen}
        onOpenChange={setIsQuickCreateOpen}
        onCreated={(seller) => onSelectExisting(seller.id, seller)}
      />
    </VStack>
  );
}
