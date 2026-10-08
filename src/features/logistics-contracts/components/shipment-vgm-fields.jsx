'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { VStack } from '@astryxdesign/core/VStack';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { MetaPill } from '@/shared/components/custom/meta/index.js';
import { FormGrid } from '@/shared/components/form-grid.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import {
  differsFromSpecs,
  SPEC_FIELDS,
  specsFill,
  specsSummary,
} from '../config/container-specs.js';
import { shipmentContainerTypeOptions } from '../config/shipment-container-types.js';
import { useContainerSpecsQuery } from '../hooks/use-container-specs-query.js';

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
 * pickup, with its own weights (max gross / tare / payload, CSC plate).
 * Leaving a valid ISO 6346 number fills the blank type and weights from
 * BIC BoxTech (BE-P `container-specs-boxtech`); "Điền lại" overwrites
 * what differs. Not in BoxTech → hand entry. "Depot lấy rỗng" picks from
 * the Port catalog's depots (`useEmptyDepots`).
 * @param {VgmFieldProps & { depots?: import('../types/index.js').Port[] }} props
 */
export function ShipmentVgmContainerFields({
  values,
  setField,
  fieldStatuses,
  depots = [],
}) {
  const specs = useContainerSpecsQuery(values.containerNumber);
  // What the last lookup put in the drawer: replaced (or cleared) when
  // another number is typed, unless edited by hand since.
  const [filled, setFilled] = useState(
    /** @type {Partial<Record<(typeof SPEC_FIELDS)[number], unknown>> | null} */ (
      null
    ),
  );

  /** @param {boolean} overwrite */
  async function fillFromSpecs(overwrite) {
    const found = await specs.fetchSpecs();
    const known = found?.status === 'Found' ? found : null;
    const fill = specsFill(values, known, { overwrite, previous: filled });
    for (const [key, value] of Object.entries(fill)) {
      setField(
        /** @type {(typeof SPEC_FIELDS)[number]} */ (key),
        /** @type {any} */ (value),
      );
    }
    setFilled(
      Object.fromEntries(
        Object.entries(fill).filter(
          ([, value]) => value !== undefined && value !== '',
        ),
      ),
    );
  }

  return (
    <VStack gap={4} hAlign="stretch">
      <FormGrid>
        <StackItem size="fill">
          <TextInput
            label="Số container"
            value={values.containerNumber}
            onChange={(value) => setField('containerNumber', value)}
            onBlur={() => {
              void fillFromSpecs(false);
            }}
            // Spinner inside the field while BoxTech is asked.
            isLoading={specs.query.isFetching}
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

      <ContainerSpecsStatus
        values={values}
        specs={specs}
        onFillAgain={() => {
          void fillFromSpecs(true);
        }}
      />

      <FormGrid>
        <StackItem size="fill">
          <TextInput
            label="Số seal"
            value={values.sealNumber}
            onChange={(value) => setField('sealNumber', value)}
            isOptional
            status={fieldStatuses.sealNumber}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <Selector
            label="Depot lấy rỗng"
            hasSearch
            hasClear
            placeholder="Chọn depot"
            value={values.emptyPickupDepotId || null}
            onChange={(value) => setField('emptyPickupDepotId', value ?? '')}
            options={depots.map((depot) => ({
              value: depot.id,
              label: depot.name,
            }))}
            isOptional
            status={fieldStatuses.emptyPickupDepotId}
            statusVariant="tooltip"
            width="100%"
          />
        </StackItem>
      </FormGrid>

      <ContainerWeightFields
        values={values}
        setField={setField}
        fieldStatuses={fieldStatuses}
      />
    </VStack>
  );
}

/**
 * What BoxTech knows about the typed number, under the number field (the
 * lookup itself is the field's spinner): the values it has (+ "Điền lại"
 * when the drawer differs), why
 * there is nothing (not in BoxTech / unavailable), an owner alert, or a
 * number failing the ISO 6346 check digit (a warning only — the number is
 * still saved as typed).
 * @param {{
 *   values: import('../types/index.js').ShipmentVgmFormValues,
 *   specs: ReturnType<typeof useContainerSpecsQuery>,
 *   onFillAgain: () => void,
 * }} props
 */
function ContainerSpecsStatus({ values, specs, onFillAgain }) {
  if (!specs.isValid) {
    return specs.number.length >= 11 ? (
      <Text size="sm" color={/** @type {any} */ ('meta-amber')}>
        Số container sai chữ số kiểm tra ISO 6346 — kiểm tra lại (vẫn lưu được).
      </Text>
    ) : null;
  }
  // While looking up, the number field shows its own spinner.
  const result = specs.query.data;
  if (!result) return null;
  if (!result.success) {
    return (
      <Text size="sm" color="secondary">
        {result.message}
      </Text>
    );
  }
  const found = result.specs;
  if (found.status !== 'Found') {
    return (
      <Text size="sm" color="secondary">
        {found.message}
      </Text>
    );
  }
  return (
    <VStack gap={2} hAlign="stretch">
      <HStack gap={2} vAlign="center" wrap="wrap">
        <MetaPill label={found.source} tone="accent" size="sm" />
        <Text size="sm" type="code" color="secondary">
          {specsSummary(found)}
        </Text>
        {differsFromSpecs(values, found) ? (
          <Button
            label="Điền lại từ BoxTech"
            type="button"
            variant="ghost"
            size="sm"
            icon={<Icon icon={RefreshCw} size="sm" />}
            onClick={onFillAgain}
          />
        ) : null}
      </HStack>
      {found.alert ? (
        <Banner
          status="warning"
          title={`BoxTech cảnh báo container này: ${found.alert}`}
          container="card"
        />
      ) : null}
    </VStack>
  );
}

/**
 * The container's own weights (CSC plate / BoxTech): entered alone at
 * pickup, needed before the VGM can be declared.
 * @param {VgmFieldProps} props
 */
function ContainerWeightFields({ values, setField, fieldStatuses }) {
  return (
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
    </FormGrid>
  );
}

/**
 * "Khai VGM" group — filled once the container is packed and weighed:
 * packing date, carrier, net weight + packaging (together, and only with
 * the container's max gross / tare / payload — see `shipmentVgmSchema`);
 * gross weight / VGM show once every weight is in. `hasPackingFields={false}`
 * leaves out the packing date and carrier (the bulk drawer edits them in
 * its table); `hasContainerWeights={false}` leaves out max gross / tare /
 * payload (the single drawer has them in its "Container" group).
 * @param {VgmFieldProps & {
 *   customers: import('../types/index.js').Customer[],
 *   hasPackingFields?: boolean,
 *   hasContainerWeights?: boolean,
 * }} props
 */
export function ShipmentVgmDeclarationFields({
  values,
  setField,
  fieldStatuses,
  customers,
  hasPackingFields = true,
  hasContainerWeights = true,
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
        Điền sau khi đóng hàng: net weight và khối lượng bao bì cùng lúc
        {hasContainerWeights
          ? ', cùng max gross / tare / payload của container.'
          : ' (cần đủ max gross / tare / payload ở phần Container).'}
      </Text>

      {hasContainerWeights ? (
        <ContainerWeightFields
          values={values}
          setField={setField}
          fieldStatuses={fieldStatuses}
        />
      ) : null}

      <FormGrid>
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
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Khối lượng bao bì"
            value={values.packagingWeight}
            onChange={(value) => setField('packagingWeight', value)}
            units="kg"
            status={fieldStatuses.packagingWeight}
            statusVariant="tooltip"
          />
        </StackItem>
      </FormGrid>

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
          Chưa khai VGM — gross weight / VGM hiện khi có đủ 5 khối lượng.
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
