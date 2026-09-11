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
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';

import { CustomerFields } from './customer-fields.jsx';
import { QuickCreateCustomerDialog } from './quick-create-customer-dialog.jsx';

/**
 * Buyer (was "Party A" on the wire — see `docs/api/Contracts.md`,
 * BE-kt-xnk) must reference an existing `Customer` from the catalog
 * (snapshotted into the contract on save): pick one from the Selector, or
 * "Thêm khách hàng" to create one on the spot (auto-selected once
 * created) — there's no separate free-typed path, so every Buyer stays
 * catalog-linked. Picking a customer prefills representative/title/
 * address/extra fields from its current catalog record, but those stay
 * **editable** — the backend only pins `CompanyName` to the catalog when
 * `SourceCustomerId` is set; every other field is independent per
 * contract, so the same customer can be Buyer on two contracts with a
 * different representative on each.
 * @param {{
 *   customers: import('../types/index.js').Customer[],
 *   sourceCustomerId: string,
 *   inlineValues: import('../types/index.js').CustomerFormValues,
 *   sourceCustomerIdStatus?: { type: 'error' | 'success', message: string },
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   onSelectExisting: (customerId: string, knownCustomer?: import('../types/index.js').Customer) => void,
 *   onSwitchToInline: () => void,
 *   onInlineFieldChange: (field: keyof import('../types/index.js').CustomerFormValues, value: string) => void,
 *   extraFieldRows: ReturnType<typeof import('../hooks/use-extra-field-rows.js').useExtraFieldRows>,
 *   isReadOnly?: boolean,
 * }} props
 */
export function BuyerFields({
  customers,
  sourceCustomerId,
  inlineValues,
  sourceCustomerIdStatus,
  fieldStatuses,
  onSelectExisting,
  onSwitchToInline,
  onInlineFieldChange,
  extraFieldRows,
  isReadOnly = false,
}) {
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const selectedCustomer = customers.find(
    (customer) => customer.id === sourceCustomerId,
  );

  return (
    <VStack gap={3} hAlign="stretch">
      <HStack gap={2} vAlign="end">
        <StackItem size="fill">
          <ReadOnlyLock isActive={isReadOnly}>
            <Selector
              label="Khách hàng"
              hasSearch
              placeholder={isReadOnly ? '—' : 'Chọn khách hàng'}
              value={sourceCustomerId}
              onChange={(value) =>
                value ? onSelectExisting(value) : onSwitchToInline()
              }
              options={customers.map((customer) => ({
                value: customer.id,
                label: customer.companyName,
              }))}
              isRequired
              status={sourceCustomerIdStatus}
              statusVariant="tooltip"
              width="100%"
            />
          </ReadOnlyLock>
        </StackItem>
        <IconButton
          isDisabled={isReadOnly}
          label="Thêm khách hàng"
          tooltip="Thêm khách hàng"
          icon={<Icon icon={IconPlus} size="sm" />}
          type="button"
          variant="secondary"
          onClick={() => setIsQuickCreateOpen(true)}
        />
      </HStack>

      {selectedCustomer ? (
        <VStack gap={3} hAlign="stretch">
          <Text type="supporting" color="secondary">
            Tên công ty: {selectedCustomer.companyName} (theo danh mục, không
            sửa được ở đây)
          </Text>
        </VStack>
      ) : inlineValues.companyName ? (
        // Editing a contract whose Buyer was saved without a catalog
        // link (a typed CompanyName, no SourceCustomerId — the backend
        // still allows that, this form just no longer offers it going
        // forward). Surface the old value so the user isn't staring at an
        // empty required Selector with no explanation, and point them at
        // the fix: pick or create the matching catalog customer.
        <Text type="supporting" color="secondary">
          Tên công ty hiện tại (chưa gắn danh mục): {inlineValues.companyName}.
          Chọn khách hàng tương ứng ở trên, hoặc &quot;Thêm khách hàng&quot; nếu
          chưa có trong danh mục.
        </Text>
      ) : null}

      <CustomerFields
        values={inlineValues}
        setField={onInlineFieldChange}
        fieldStatuses={fieldStatuses}
        extraFieldRows={extraFieldRows}
        showCompanyName={false}
        isCollapsible
        isReadOnly={isReadOnly}
      />

      <QuickCreateCustomerDialog
        isOpen={isQuickCreateOpen}
        onOpenChange={setIsQuickCreateOpen}
        onCreated={(customer) => onSelectExisting(customer.id, customer)}
      />
    </VStack>
  );
}
