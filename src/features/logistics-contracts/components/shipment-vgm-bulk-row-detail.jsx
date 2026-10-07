'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';

const WEIGHT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `[field, label]` — the five weights a VGM needs, in entry order. */
const WEIGHT_FIELDS = /** @type {const} */ ([
  ['maxGross', 'Max gross'],
  ['tare', 'Tare'],
  ['payload', 'Payload'],
  ['netWeight', 'Net weight'],
  ['packagingWeight', 'Khối lượng bao bì'],
]);

/** `[field, label]` — the optional times. */
const TIME_FIELDS = /** @type {const} */ ([
  ['plannedPackingTime', 'Giờ đóng dự kiến'],
  ['actualPackingTime', 'Giờ đóng thực tế'],
  ['truckArrivalTime', 'Giờ xe vào nhà máy'],
]);

/**
 * One row's VGM weights, times and note in the "Thêm danh sách container"
 * drawer (card 4). Same fields as `ShipmentVgmDeclarationFields` /
 * `ShipmentVgmAdditionalFields`, laid out for the wide drawer: the five
 * weights on one line with the resulting gross weight / VGM under them,
 * the three times on one line, the note full width (user: the stacked
 * two-column version was "quá xấu", 2026-10-07).
 * @param {{
 *   row: import('../types/index.js').BulkContainerRow,
 *   setField: import('./shipment-vgm-fields.jsx').VgmFieldProps['setField'],
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * }} props
 */
export function ShipmentVgmBulkRowDetail({ row, setField, fieldStatuses }) {
  const entered = WEIGHT_FIELDS.filter(
    ([field]) => row[field] !== undefined,
  ).length;
  const isDeclared = entered === WEIGHT_FIELDS.length;
  const grossWeight = (row.netWeight ?? 0) + (row.packagingWeight ?? 0);
  const vgm = grossWeight + (row.tare ?? 0);

  return (
    <VStack gap={5} hAlign="stretch">
      <VStack gap={3} hAlign="stretch">
        <HStack gap={2} vAlign="center" hAlign="between" wrap="wrap">
          <Text weight="semibold">Khối lượng</Text>
          <Text size="sm" color="secondary">
            {entered}/{WEIGHT_FIELDS.length} khối lượng
          </Text>
        </HStack>
        <Grid columns={{ minWidth: 150, max: 5 }} gap={3}>
          {WEIGHT_FIELDS.map(([field, label]) => (
            <FormattedNumberTextInput
              key={field}
              label={label}
              value={row[field]}
              onChange={(value) => setField(field, value)}
              units="kg"
              status={fieldStatuses[field]}
              statusVariant="tooltip"
            />
          ))}
        </Grid>
        <HStack
          gap={6}
          vAlign="center"
          wrap="wrap"
          xstyle={[styles.result, isDeclared && styles.resultDeclared]}
        >
          <ResultValue
            label="Gross weight"
            value={isDeclared ? grossWeight : null}
          />
          <ResultValue label="VGM" value={isDeclared ? vgm : null} isAccent />
          {isDeclared ? null : (
            <Text size="sm" color="secondary">
              Nhập đủ 5 khối lượng để tính gross weight và VGM.
            </Text>
          )}
        </HStack>
      </VStack>

      <VStack gap={3} hAlign="stretch">
        <Text weight="semibold">Thời gian & ghi chú</Text>
        <Grid columns={{ minWidth: 200, max: 3 }} gap={3}>
          {TIME_FIELDS.map(([field, label]) => (
            <TimeInput
              key={field}
              label={label}
              value={
                /** @type {import('@astryxdesign/core/TimeInput').ISOTimeString} */ (
                  row[field] || undefined
                )
              }
              onChange={(value) => setField(field, value ?? '')}
              hasClear
              hourFormat="24h"
              isOptional
              status={fieldStatuses[field]}
              statusVariant="tooltip"
            />
          ))}
        </Grid>
        <TextArea
          label="Ghi chú"
          value={row.note}
          onChange={(value) => setField('note', value)}
          isOptional
          rows={2}
          maxLength={2000}
          status={fieldStatuses.note}
          statusVariant="tooltip"
        />
      </VStack>
    </VStack>
  );
}

/**
 * @param {{ label: string, value: number | null, isAccent?: boolean }} props
 */
function ResultValue({ label, value, isAccent = false }) {
  return (
    <HStack gap={2} vAlign="center">
      <Text size="sm" color="secondary">
        {label}
      </Text>
      <Text
        weight="bold"
        color={value !== null && isAccent ? 'accent' : 'primary'}
        hasTabularNumbers
      >
        {value === null ? '—' : `${WEIGHT_FORMATTER.format(value)} kg`}
      </Text>
    </HStack>
  );
}

const styles = stylex.create({
  result: {
    backgroundColor: 'var(--meta-inset-bg)',
    borderRadius: 'var(--radius-element)',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-4)',
  },
  resultDeclared: {
    backgroundColor: 'var(--meta-accent-tint-strong)',
  },
});
