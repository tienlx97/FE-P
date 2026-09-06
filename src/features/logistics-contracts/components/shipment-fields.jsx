'use client';
import { CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMemo } from 'react';

import { quantityUnitForShipmentType } from '../config/shipment-quantity-units.js';
import { ShipmentBookingFields } from './shipment-booking-fields.jsx';
import { ShipmentCostLinesFields } from './shipment-cost-lines-fields.jsx';
import { ShipmentLotFields } from './shipment-lot-fields.jsx';
import { ShipmentVgmSection } from './shipment-vgm-section.jsx';

/**
 * `Shipment` field-set, split into three tabs — per user request
 * (2026-09-05) that this form (Book info + Lot info + logistics costs,
 * previously all collapsible cards on one long scroll) gets "Thông tin" /
 * "VGM" / "Chi phí Logistics" tabs over a fixed height instead.
 * "Thông tin" keeps Book info and Lot info as two collapsible cards inside
 * it, both expanded by default since every field in each is either
 * required or commonly filled in.
 * `shipmentNumber`/`shipmentCode` are backend-assigned and never editable
 * — shown read-only in the dialog header when editing (see
 * `ShipmentFormDialog`).
 *
 * "VGM" needs an existing `shipmentId` (VGM records belong to an already-
 * created Shipment) — while creating a new one, the tab explains that
 * instead of rendering `ShipmentVgmSection`. This dialog is not rendered
 * inside any `<table>` row-expansion (unlike `ShipmentExpandedDetails`), so
 * `ShipmentVgmSection` is left to own its own add/edit dialog here (no
 * `onAddVgm`/`onEditVgm` passed) — see that component's own doc comment for
 * why that split exists.
 *
 * `type` ("Loại hình") is locked once editing an existing shipment (2026-
 * 09-03 business rule, BE-kt-xnk: `Type` is immutable after creation,
 * since `ShipmentCode`'s `LCL-`/`LOT-` prefix and per-type numbering both
 * depend on it) — `isEditing` disables the Selector with an explanatory
 * message instead of just leaving it editable and having the backend
 * silently ignore the change. `quantityUnit` is no longer its own field:
 * it's derived from `type` (LCL → Kiện, FCL → Cont) and shown as the
 * quantity input's `units` suffix instead of a separate Selector.
 * @param {{
 *   values: import('../types/index.js').ShipmentFormValues,
 *   setField: <K extends keyof import('../types/index.js').ShipmentFormValues>(field: K, value: import('../types/index.js').ShipmentFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   customers: import('../types/index.js').Customer[],
 *   isEditing: boolean,
 *   costLineRows: ReturnType<typeof import('../hooks/use-shipment-cost-line-rows.js').useShipmentCostLineRows>,
 *   contractId: string,
 *   shipmentId: string | null,
 *   activeTab: string,
 *   isReadOnly?: boolean,
 * }} props
 */
export function ShipmentFields({
  values,
  setField,
  fieldStatuses,
  customers,
  isEditing,
  costLineRows,
  contractId,
  shipmentId,
  activeTab,
  isReadOnly = false,
}) {
  const derivedQuantityUnit = quantityUnitForShipmentType(values.type);

  const customersById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  return (
    <VStack gap={3} hAlign="stretch">
      <VStack gap={3} hAlign="stretch">
        {activeTab === 'info' ? (
          <CollapsibleGroup
            type="multiple"
            defaultValue={['book', 'lot']}
            value={
              Object.values(fieldStatuses).some(Boolean)
                ? ['book', 'lot']
                : undefined
            }
          >
            <VStack gap={3} hAlign="stretch">
              <ShipmentBookingFields
                values={values}
                setField={setField}
                fieldStatuses={fieldStatuses}
                customers={customers}
                isReadOnly={isReadOnly}
              />

              <ShipmentLotFields
                values={values}
                setField={setField}
                fieldStatuses={fieldStatuses}
                isEditing={isEditing}
                derivedQuantityUnit={derivedQuantityUnit}
                isReadOnly={isReadOnly}
              />
            </VStack>
          </CollapsibleGroup>
        ) : null}

        {activeTab === 'vgm' ? (
          shipmentId ? (
            <ShipmentVgmSection
              contractId={contractId}
              shipmentId={shipmentId}
              customersById={customersById}
              isReadOnly={isReadOnly}
            />
          ) : (
            <Text color="secondary">Lưu shipment trước khi thêm VGM.</Text>
          )
        ) : null}

        {activeTab === 'costs' ? (
          <ShipmentCostLinesFields
            rows={costLineRows.rows}
            customers={customers}
            isReadOnly={isReadOnly}
            onAddRow={costLineRows.addRow}
            onRemoveRow={costLineRows.removeRow}
            onUpdateRowField={costLineRows.updateRowField}
          />
        ) : null}
      </VStack>
    </VStack>
  );
}
