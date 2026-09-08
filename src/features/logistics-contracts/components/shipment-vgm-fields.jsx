'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { VStack } from '@astryxdesign/core/VStack';

import { FormGrid } from '@/shared/components/form-grid.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { shipmentContainerTypeOptions } from '../config/shipment-container-types.js';

/**
 * Main `ShipmentVgm` field-set — rendered inside the form dialog's first
 * collapsible card. `sequenceNumber` is backend-assigned and never
 * editable; `grossWeight`/`vgm` are backend-computed and shown read-only
 * here, never inputs. Field order per user request (2026-09-03 follow-up):
 * `packingDate`/`carrierCustomerId` (both required, backend-enforced) lead
 * — a mis-entered container's most identifying facts, when and by whom —
 * each on its own row, then the container/weight fields pair up two per
 * row. The three optional schedule/arrival times plus `note` live in the
 * dialog's second card — see `ShipmentVgmAdditionalFields` below.
 * @param {{
 *   values: import('../types/index.js').ShipmentVgmFormValues,
 *   setField: <K extends keyof import('../types/index.js').ShipmentVgmFormValues>(field: K, value: import('../types/index.js').ShipmentVgmFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   customers: import('../types/index.js').Customer[],
 * }} props
 */
export function ShipmentVgmFields({
  values,
  setField,
  fieldStatuses,
  customers,
}) {
  const grossWeight = (values.netWeight ?? 0) + (values.packagingWeight ?? 0);
  const vgm = grossWeight + (values.tare ?? 0);

  return (
    <VStack gap={4} hAlign="stretch">
      <DateInput
        label="Ngày đóng hàng"
        value={
          /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
            values.packingDate
          )
        }
        onChange={(value) => setField('packingDate', value ?? '')}
        format={formatDateInputValue}
        isRequired
        status={fieldStatuses.packingDate}
        statusVariant="tooltip"
      />

      <Selector
        label="Nhà cung cấp"
        hasSearch
        placeholder="Chọn nhà cung cấp"
        value={values.carrierCustomerId}
        onChange={(value) => setField('carrierCustomerId', value ?? '')}
        options={customers.map((customer) => ({
          value: customer.id,
          label: customer.companyName,
        }))}
        isRequired
        status={fieldStatuses.carrierCustomerId}
        statusVariant="tooltip"
        width="100%"
      />

      <FormGrid>
        <StackItem size="fill">
          <TextInput
            label="Tên cont"
            value={values.containerNumber}
            onChange={(value) => setField('containerNumber', value)}
            isRequired
            status={fieldStatuses.containerNumber}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <TextInput
            label="Tên seal"
            value={values.sealNumber}
            onChange={(value) => setField('sealNumber', value)}
            isRequired
            status={fieldStatuses.sealNumber}
            statusVariant="tooltip"
          />
        </StackItem>
      </FormGrid>

      <FormGrid>
        <StackItem size="fill">
          <Selector
            label="Loại cont"
            placeholder="Chọn loại"
            value={values.containerType}
            onChange={(value) =>
              setField(
                'containerType',
                /** @type {import('../types/index.js').ShipmentContainerType | ''} */ (
                  value ?? ''
                ),
              )
            }
            options={shipmentContainerTypeOptions}
            isRequired
            status={fieldStatuses.containerType}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Max gross"
            value={values.maxGross}
            onChange={(value) => setField('maxGross', value)}
            units="kg"
            isRequired
            status={fieldStatuses.maxGross}
            statusVariant="tooltip"
          />
        </StackItem>
      </FormGrid>

      <FormGrid>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Tare"
            value={values.tare}
            onChange={(value) => setField('tare', value)}
            units="kg"
            isRequired
            status={fieldStatuses.tare}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Payload"
            value={values.payload}
            onChange={(value) => setField('payload', value)}
            units="kg"
            isRequired
            status={fieldStatuses.payload}
            statusVariant="tooltip"
          />
        </StackItem>
      </FormGrid>

      <FormGrid>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Net weight"
            value={values.netWeight}
            onChange={(value) => setField('netWeight', value)}
            units="kg"
            isRequired
            status={fieldStatuses.netWeight}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Khối lượng bao bì"
            value={values.packagingWeight}
            onChange={(value) => setField('packagingWeight', value)}
            units="kg"
            isRequired
            status={fieldStatuses.packagingWeight}
            statusVariant="tooltip"
          />
        </StackItem>
      </FormGrid>

      <HStack gap={5}>
        <HStack gap={1} vAlign="center">
          <Text color="secondary">Gross weight:</Text>
          <Text weight="semibold">{grossWeight.toFixed(2)} kg</Text>
        </HStack>
        <HStack gap={1} vAlign="center">
          <Text color="secondary">VGM:</Text>
          <Text weight="semibold">{vgm.toFixed(2)} kg</Text>
        </HStack>
      </HStack>
    </VStack>
  );
}

/**
 * "Thông tin bổ sung" field-set — the schedule/arrival times and note,
 * rendered inside the form dialog's second collapsible card. All optional
 * (`hasClear` lets the user remove a previously set time); `packingDate`/
 * `carrierCustomerId` moved out to `ShipmentVgmFields` above since they're
 * required, not "additional".
 * @param {{
 *   values: import('../types/index.js').ShipmentVgmFormValues,
 *   setField: <K extends keyof import('../types/index.js').ShipmentVgmFormValues>(field: K, value: import('../types/index.js').ShipmentVgmFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * }} props
 */
export function ShipmentVgmAdditionalFields({
  values,
  setField,
  fieldStatuses,
}) {
  return (
    <VStack gap={4} hAlign="stretch">
      <TimeInput
        label="Lịch đóng hàng dự kiến"
        value={
          /** @type {import('@astryxdesign/core/TimeInput').ISOTimeString} */ (
            values.plannedPackingTime || undefined
          )
        }
        onChange={(value) => setField('plannedPackingTime', value ?? '')}
        hasClear
        hourFormat="24h"
        isOptional
        status={fieldStatuses.plannedPackingTime}
        statusVariant="tooltip"
      />

      <TimeInput
        label="Lịch đóng hàng thực tế"
        value={
          /** @type {import('@astryxdesign/core/TimeInput').ISOTimeString} */ (
            values.actualPackingTime || undefined
          )
        }
        onChange={(value) => setField('actualPackingTime', value ?? '')}
        hasClear
        hourFormat="24h"
        isOptional
        status={fieldStatuses.actualPackingTime}
        statusVariant="tooltip"
      />

      <TimeInput
        label="Thời gian xe vào nhà máy"
        value={
          /** @type {import('@astryxdesign/core/TimeInput').ISOTimeString} */ (
            values.truckArrivalTime || undefined
          )
        }
        onChange={(value) => setField('truckArrivalTime', value ?? '')}
        hasClear
        hourFormat="24h"
        isOptional
        status={fieldStatuses.truckArrivalTime}
        statusVariant="tooltip"
      />

      <TextArea
        label="Ghi chú"
        value={values.note}
        onChange={(value) => setField('note', value)}
        isOptional
        maxLength={2000}
        status={fieldStatuses.note}
        statusVariant="tooltip"
      />
    </VStack>
  );
}
