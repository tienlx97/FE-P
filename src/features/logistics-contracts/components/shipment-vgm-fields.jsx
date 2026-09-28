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
 * @typedef {{
 *   values: import('../types/index.js').ShipmentVgmFormValues,
 *   setField: <K extends keyof import('../types/index.js').ShipmentVgmFormValues>(field: K, value: import('../types/index.js').ShipmentVgmFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * }} VgmFieldProps
 */

/**
 * "Container" group — container first, VGM later (2026-09-27): the
 * container (number + type required, seal optional) is recorded at empty
 * pickup.
 * @param {VgmFieldProps} props
 */
export function ShipmentVgmContainerFields({
  values,
  setField,
  fieldStatuses,
}) {
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
    </VStack>
  );
}

/**
 * "Khai VGM" group — filled once the container is packed and weighed:
 * packing date, carrier and the five weights (all or none, see
 * `shipmentVgmSchema`); gross weight / VGM show once every weight is in.
 * `hasPackingFields={false}` leaves out the packing date and carrier (the
 * bulk drawer edits them in its table).
 * @param {VgmFieldProps & {
 *   customers: import('../types/index.js').Customer[],
 *   hasPackingFields?: boolean,
 * }} props
 */
export function ShipmentVgmDeclarationFields({
  values,
  setField,
  fieldStatuses,
  customers,
  hasPackingFields = true,
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
      {hasPackingFields ? (
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
      ) : null}

      <Text size="sm" color="secondary">
        Điền sau khi đóng hàng. Nhập đủ 5 khối lượng, hoặc để trống cả 5 khi
        chưa khai.
      </Text>

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
        <HStack gap={5} wrap="wrap">
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
 * "Thời gian & ghi chú" group — the packing / truck arrival times and the
 * note, all optional (`hasClear` removes a previously set time).
 * @param {VgmFieldProps} props
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
