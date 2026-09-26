'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { VStack } from '@astryxdesign/core/VStack';

import { FormGrid } from '@/shared/components/form-grid.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { shipmentContainerTypeOptions } from '../config/shipment-container-types.js';

/**
 * Main field-set — container first, VGM later (2026-09-27): the container
 * (number + type required, seal optional) is recorded at empty pickup;
 * the "Khai VGM" part (packing date, carrier, the five weights) stays
 * empty until the container is packed and weighed. The weights go
 * together (all or none, see `shipmentVgmSchema`); gross weight / VGM are
 * shown once every weight is in. The optional times and note live in the
 * dialog's second card (`ShipmentVgmAdditionalFields`).
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
  const isDeclared = [
    values.maxGross,
    values.tare,
    values.payload,
    values.netWeight,
    values.packagingWeight,
  ].every((value) => value !== undefined);
  const grossWeight = (values.netWeight ?? 0) + (values.packagingWeight ?? 0);
  const vgm = grossWeight + (values.tare ?? 0);

  return (
    <VStack gap={4} hAlign="stretch">
      <FormGrid>
        <StackItem size="fill">
          <TextInput
            label="Số container"
            value={values.containerNumber}
            onChange={(value) => setField('containerNumber', value)}
            isRequired
            status={fieldStatuses.containerNumber}
            statusVariant="tooltip"
          />
        </StackItem>
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
      </FormGrid>

      <TextInput
        label="Số seal"
        value={values.sealNumber}
        onChange={(value) => setField('sealNumber', value)}
        isOptional
        status={fieldStatuses.sealNumber}
        statusVariant="tooltip"
      />

      <VStack gap={0.5}>
        <Text weight="semibold">Khai VGM</Text>
        <Text size="sm" color="secondary">
          Điền sau khi đóng hàng. Để trống cả 5 khối lượng khi chưa khai.
        </Text>
      </VStack>

      <FormGrid>
        <StackItem size="fill">
          <DateInput
            label="Ngày đóng hàng"
            value={
              /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                values.packingDate || undefined
              )
            }
            onChange={(value) => setField('packingDate', value ?? '')}
            format={formatDateInputValue}
            hasClear
            isOptional
            status={fieldStatuses.packingDate}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <Selector
            label="Nhà vận chuyển"
            hasSearch
            hasClear
            placeholder="Chọn nhà cung cấp"
            value={values.carrierCustomerId || null}
            onChange={(value) => setField('carrierCustomerId', value ?? '')}
            options={customers.map((customer) => ({
              value: customer.id,
              label: customer.companyName,
            }))}
            isOptional
            status={fieldStatuses.carrierCustomerId}
            statusVariant="tooltip"
            width="100%"
          />
        </StackItem>
      </FormGrid>

      <FormGrid>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Max gross"
            value={values.maxGross}
            onChange={(value) => setField('maxGross', value)}
            units="kg"
            status={fieldStatuses.maxGross}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Tare"
            value={values.tare}
            onChange={(value) => setField('tare', value)}
            units="kg"
            status={fieldStatuses.tare}
            statusVariant="tooltip"
          />
        </StackItem>
      </FormGrid>

      <FormGrid>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Payload"
            value={values.payload}
            onChange={(value) => setField('payload', value)}
            units="kg"
            status={fieldStatuses.payload}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Net weight"
            value={values.netWeight}
            onChange={(value) => setField('netWeight', value)}
            units="kg"
            status={fieldStatuses.netWeight}
            statusVariant="tooltip"
          />
        </StackItem>
      </FormGrid>

      <FormattedNumberTextInput
        label="Khối lượng bao bì"
        value={values.packagingWeight}
        onChange={(value) => setField('packagingWeight', value)}
        units="kg"
        status={fieldStatuses.packagingWeight}
        statusVariant="tooltip"
      />

      {isDeclared ? (
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
      ) : (
        <Text size="sm" color="secondary">
          Chưa khai VGM — gross weight / VGM hiện khi đủ 5 khối lượng.
        </Text>
      )}
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
