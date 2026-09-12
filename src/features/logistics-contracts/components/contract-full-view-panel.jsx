'use client';

import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { InputGroup } from '@astryxdesign/core/InputGroup';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useMemo, useState } from 'react';

import { AdvancedFilterBuilder } from '@/shared/components/advanced-filter-builder.jsx';
import { CommonDialog } from '@/shared/components/common-dialog.jsx';

import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import { labelForShipmentStatus } from '../config/shipment-status.js';
import { labelForShipmentType } from '../config/shipment-types.js';
import { useShipmentsVgmsQueries } from '../hooks/use-shipments-vgms-queries.js';
import { ShipmentCostsSection } from './shipment-costs-section.jsx';
import { ShipmentInfoSection } from './shipment-info-section.jsx';
import { ShipmentVgmSection } from './shipment-vgm-section.jsx';

/** @type {ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterFieldDef>} */
const FILTER_FIELD_DEFS = [
  { key: 'shipmentText', label: 'Mã / Tên Shipment', type: 'string' },
  { key: 'type', label: 'Loại hình', type: 'string' },
  { key: 'status', label: 'Tình trạng', type: 'string' },
  { key: 'bookingNumber', label: 'Số booking', type: 'string' },
  { key: 'billOfLadingNumber', label: 'Số B/L', type: 'string' },
  { key: 'shippingLine', label: 'Line tàu', type: 'string' },
  { key: 'vesselName', label: 'Tên tàu', type: 'string' },
  { key: 'placeOfLoading', label: 'Cảng/nơi xếp hàng', type: 'string' },
  { key: 'placeOfDischarge', label: 'Cảng/nơi đến', type: 'string' },
  { key: 'supplierName', label: 'Forwarder', type: 'string' },
  { key: 'coNumber', label: 'Mã C/O', type: 'string' },
  { key: 'customsDeclarationNumber', label: 'Số tờ khai', type: 'string' },
  { key: 'containerNumber', label: 'Số cont (VGM)', type: 'string' },
  { key: 'sealNumber', label: 'Số seal (VGM)', type: 'string' },
  { key: 'costName', label: 'Tên khoản chi phí', type: 'string' },
  { key: 'invoiceNumber', label: 'Số hoá đơn', type: 'string' },
];

/**
 * One shipment's searchable text: every field shown by
 * `ShipmentInfoSection`/`ShipmentCostsSection`, plus its VGM rows (fetched
 * separately — see `useShipmentsVgmsQueries`). Lowercased, no diacritics
 * folding — matches `AdvanceTable`'s own plain substring search.
 * @param {import('../types/index.js').Shipment} shipment
 * @param {string} supplierName
 * @param {import('../types/index.js').ShipmentVgm[]} vgms
 * @param {Map<string, import('../types/index.js').Customer>} customersById
 */
function buildSearchHaystack(shipment, supplierName, vgms, customersById) {
  const parts = [
    shipment.shipmentCode,
    shipment.name,
    labelForShipmentType(shipment.type),
    labelForShipmentStatus(shipment.status),
    shipment.quantityAmount,
    labelForShipmentQuantityUnit(shipment.quantityUnit),
    shipment.bookingNumber,
    shipment.billOfLadingNumber,
    shipment.shippingLine,
    shipment.vesselName,
    shipment.placeOfLoading,
    shipment.placeOfDischarge,
    shipment.coNumber,
    supplierName,
    ...shipment.costs.flatMap((cost) => [
      cost.name,
      cost.note,
      cost.invoiceNumber,
      cost.providerCustomerId
        ? customersById.get(cost.providerCustomerId)?.companyName
        : null,
    ]),
    ...vgms.flatMap((vgm) => [
      vgm.containerNumber,
      vgm.sealNumber,
      customersById.get(vgm.carrierCustomerId)?.companyName,
    ]),
  ];
  return parts.filter((part) => part != null).join(' | ').toLowerCase();
}

/**
 * A `FILTER_FIELD_DEFS` key's underlying value(s) on one Shipment. Most are
 * single-valued; container/seal/cost name/invoice number come from a
 * one-to-many relation (a Shipment can have several VGM rows or cost
 * lines), so a condition on them matches if ANY of that Shipment's values
 * satisfies it — there is no single "the" container number to compare.
 * `type`/`status` match against their Vietnamese display label (same as
 * `buildSearchHaystack`'s plain search), not the raw enum code, since the
 * user types what they see on screen. `supplierName` needs `customersById`
 * — every other field reads straight off `shipment`/`vgms`.
 * @param {import('../types/index.js').Shipment} shipment
 * @param {import('../types/index.js').ShipmentVgm[]} vgms
 * @param {Map<string, import('../types/index.js').Customer>} customersById
 * @param {string} fieldKey
 * @returns {string[]}
 */
function fieldValues(shipment, vgms, customersById, fieldKey) {
  switch (fieldKey) {
    case 'shipmentText':
      return [shipment.shipmentCode, shipment.name];
    case 'type':
      return [labelForShipmentType(shipment.type)];
    case 'status':
      return [labelForShipmentStatus(shipment.status)];
    case 'bookingNumber':
      return [shipment.bookingNumber ?? ''];
    case 'billOfLadingNumber':
      return [shipment.billOfLadingNumber ?? ''];
    case 'shippingLine':
      return [shipment.shippingLine ?? ''];
    case 'vesselName':
      return [shipment.vesselName ?? ''];
    case 'placeOfLoading':
      return [shipment.placeOfLoading ?? ''];
    case 'placeOfDischarge':
      return [shipment.placeOfDischarge ?? ''];
    case 'supplierName':
      return [customersById.get(shipment.supplierCustomerId)?.companyName ?? ''];
    case 'coNumber':
      return [shipment.coNumber ?? ''];
    case 'customsDeclarationNumber':
      return [shipment.customsDeclarationNumber ?? ''];
    case 'containerNumber':
      return vgms.map((vgm) => vgm.containerNumber);
    case 'sealNumber':
      return vgms.map((vgm) => vgm.sealNumber);
    case 'costName':
      return shipment.costs.map((cost) => cost.name);
    case 'invoiceNumber':
      return shipment.costs.map((cost) => cost.invoiceNumber ?? '');
    default:
      return [];
  }
}

/**
 * One condition vs. one Shipment — string operators only (every
 * `FILTER_FIELD_DEFS` entry is `type: 'string'`), evaluated client-side
 * against `fieldValues()` rather than sent to a server.
 * @param {import('../types/index.js').Shipment} shipment
 * @param {import('../types/index.js').ShipmentVgm[]} vgms
 * @param {Map<string, import('../types/index.js').Customer>} customersById
 * @param {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition} condition
 */
function matchesCondition(shipment, vgms, customersById, condition) {
  const values = fieldValues(shipment, vgms, customersById, condition.field).map(
    (value) => (value ?? '').toLowerCase(),
  );
  const needle = condition.value.trim().toLowerCase();
  switch (condition.operator) {
    case 'IsEmpty':
      return values.every((value) => value === '');
    case 'IsNotEmpty':
      return values.some((value) => value !== '');
    case 'Equals':
      return values.some((value) => value === needle);
    case 'NotContains':
      return values.every((value) => !value.includes(needle));
    case 'StartsWith':
      return values.some((value) => value.startsWith(needle));
    case 'EndsWith':
      return values.some((value) => value.endsWith(needle));
    case 'Contains':
    default:
      return values.some((value) => value.includes(needle));
  }
}

/**
 * Every condition folded left-to-right by its own `connector` (the first
 * condition's connector is ignored, same as `AdvancedFilterBuilder`'s own
 * row UI never shows one on the first row).
 * @param {import('../types/index.js').Shipment} shipment
 * @param {import('../types/index.js').ShipmentVgm[]} vgms
 * @param {Map<string, import('../types/index.js').Customer>} customersById
 * @param {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} conditions
 */
function matchesAllConditions(shipment, vgms, customersById, conditions) {
  if (conditions.length === 0) return true;
  return conditions.reduce(
    (acc, condition, index) => {
      const result = matchesCondition(shipment, vgms, customersById, condition);
      if (index === 0) return result;
      return condition.connector === 'Or' ? acc || result : acc && result;
    },
    /** @type {boolean} */ (true),
  );
}

/**
 * "Xem đầy đủ" — a read-only, single-screen lookup across every Shipment of
 * a contract (per user request, 2026-09-12): a search bar filters the
 * Shipment sub-tabs, and the selected Shipment's info/VGM/costs render
 * stacked on one screen instead of the row-expansion + inner-tab navigation
 * "Liên quan" already uses (that tab stays as-is for management — add/edit
 * shipment, add/edit VGM). Fetches every shipment's VGM list up front so
 * the search bar can match container/seal numbers without the user opening
 * each shipment first; every other query in this workspace stays lazy
 * per-shipment. Only ever mounted while "Xem đầy đủ" is the active tab
 * (`ContractExpandedDetails` unmounts it otherwise, same as every other
 * non-profile tab body), so the batch fetch never fires for a caller who
 * hasn't opened this tab.
 *
 * A funnel `IconButton` next to the plain search box (same `icon="funnel"`/
 * `variant="ghost"` look as `AdvanceTable`'s own funnel trigger) opens "Bộ
 * lọc nâng cao" — per user request, this reuses `AdvancedFilterBuilder` as-
 * is (the same field/operator/value row + "Chọn điều kiện lọc" add-field
 * Selector `AdvanceTable`'s own "Bộ lọc nâng cao" dialog uses for
 * `/logistics/contracts`'s own list) rather than a fixed set of always-
 * visible text boxes. Every field here is `type: 'string'`; conditions
 * evaluate client-side against `fieldValues()` instead of a server filter.
 * Applying it (non-empty conditions) replaces the plain search — that box
 * disables while advanced search is active, since this panel has no
 * per-column filters to layer it onto the way `AdvanceTable` does.
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   shipments: import('../types/index.js').Shipment[],
 *   customersById: Map<string, import('../types/index.js').Customer>,
 *   costCategoriesById: Map<string, import('../types/index.js').ShipmentCostCategory>,
 * }} props
 */
export function ContractFullViewPanel({
  contract,
  shipments,
  customersById,
  costCategoriesById,
}) {
  const [query, setQuery] = useState('');
  const [appliedConditions, setAppliedConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ (
      []
    ),
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [advancedDraft, setAdvancedDraft] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ (
      []
    ),
  );
  const [selectedShipmentId, setSelectedShipmentId] = useState(
    /** @type {string | null} */ (null),
  );

  const shipmentIds = useMemo(
    () => shipments.map((shipment) => shipment.id),
    [shipments],
  );
  const vgmsByShipmentId = useShipmentsVgmsQueries(contract.id, shipmentIds);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredShipments = useMemo(() => {
    if (appliedConditions.length > 0) {
      return shipments.filter((shipment) =>
        matchesAllConditions(
          shipment,
          vgmsByShipmentId.get(shipment.id) ?? [],
          customersById,
          appliedConditions,
        ),
      );
    }
    if (!normalizedQuery) return shipments;
    return shipments.filter((shipment) => {
      const supplierName =
        customersById.get(shipment.supplierCustomerId)?.companyName ?? '';
      const haystack = buildSearchHaystack(
        shipment,
        supplierName,
        vgmsByShipmentId.get(shipment.id) ?? [],
        customersById,
      );
      return haystack.includes(normalizedQuery);
    });
  }, [
    shipments,
    normalizedQuery,
    appliedConditions,
    vgmsByShipmentId,
    customersById,
  ]);

  // Derived, not synced via effect: falls back to the first filtered
  // shipment whenever the user's last pick drops out of the filtered list
  // (a fresh search, or the previously-selected shipment itself no longer
  // matching), without an extra render pass.
  const effectiveShipmentId = filteredShipments.some(
    (shipment) => shipment.id === selectedShipmentId,
  )
    ? selectedShipmentId
    : (filteredShipments[0]?.id ?? null);
  const selectedShipment = filteredShipments.find(
    (shipment) => shipment.id === effectiveShipmentId,
  );

  function openAdvancedSearch() {
    setAdvancedDraft(appliedConditions);
    setIsAdvancedOpen(true);
  }

  // Clears immediately (applies the empty filter) rather than only
  // resetting the draft — matches `AdvanceTable`'s own "Bỏ lọc" behavior.
  function handleAdvancedFilterClear() {
    setAdvancedDraft([]);
    setAppliedConditions([]);
  }

  function handleAdvancedFilterSubmit() {
    setAppliedConditions(advancedDraft);
    if (advancedDraft.length > 0) setQuery('');
    setIsAdvancedOpen(false);
  }

  return (
    <VStack gap={2} hAlign="stretch">
      <InputGroup label="Tìm kiếm" isLabelHidden>
        <TextInput
          label="Tìm kiếm"
          isLabelHidden
          placeholder={
            appliedConditions.length > 0
              ? 'Đang dùng bộ lọc nâng cao'
              : 'Tìm theo Shipment, container, chi phí...'
          }
          startIcon="search"
          hasClear
          isDisabled={appliedConditions.length > 0}
          value={query}
          onChange={setQuery}
        />
        <IconButton
          label="Bộ lọc nâng cao"
          tooltip="Bộ lọc nâng cao"
          icon={<Icon icon="funnel" size="sm" />}
          variant="ghost"
          onClick={openAdvancedSearch}
        />
      </InputGroup>

      {appliedConditions.length > 0 ? (
        <HStack gap={2} vAlign="center">
          <Text color="secondary">Đang áp dụng bộ lọc nâng cao</Text>
          <Button
            label="Bỏ lọc"
            variant="ghost"
            size="sm"
            onClick={() => setAppliedConditions([])}
          />
        </HStack>
      ) : null}

      {shipments.length === 0 ? (
        <Text color="secondary">Chưa có Shipment nào</Text>
      ) : filteredShipments.length === 0 ? (
        <Text color="secondary">Không tìm thấy Shipment phù hợp</Text>
      ) : (
        <>
          <TabList
            value={effectiveShipmentId ?? ''}
            onChange={setSelectedShipmentId}
            hasDivider
          >
            {filteredShipments.map((shipment) => (
              <Tab
                key={shipment.id}
                value={shipment.id}
                label={shipment.shipmentCode}
              />
            ))}
          </TabList>

          {selectedShipment ? (
            <VStack gap={4} hAlign="stretch">
              <ShipmentInfoSection
                shipment={selectedShipment}
                supplierName={
                  customersById.get(selectedShipment.supplierCustomerId)
                    ?.companyName ?? ''
                }
              />
              <Divider />
              <ShipmentVgmSection
                contractId={contract.id}
                shipmentId={selectedShipment.id}
                customersById={customersById}
                isReadOnly
              />
              <Divider />
              <ShipmentCostsSection
                shipment={selectedShipment}
                customersById={customersById}
                costCategoriesById={costCategoriesById}
              />
            </VStack>
          ) : null}
        </>
      )}

      <CommonDialog
        isOpen={isAdvancedOpen}
        onOpenChange={setIsAdvancedOpen}
        purpose="form"
        width={800}
      >
        <Layout
          header={
            <DialogHeader
              title="Bộ lọc nâng cao"
              onOpenChange={() => setIsAdvancedOpen(false)}
            />
          }
          content={
            <LayoutContent>
              <VStack gap={3} hAlign="stretch">
                <AdvancedFilterBuilder
                  fields={FILTER_FIELD_DEFS}
                  conditions={advancedDraft}
                  onChange={setAdvancedDraft}
                />
              </VStack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="between">
                <Button
                  label="Bỏ lọc"
                  variant="secondary"
                  onClick={handleAdvancedFilterClear}
                />
                <Button
                  label="Lọc"
                  variant="primary"
                  onClick={handleAdvancedFilterSubmit}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </CommonDialog>
    </VStack>
  );
}
