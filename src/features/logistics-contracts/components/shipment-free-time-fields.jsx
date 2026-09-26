'use client';

import { HStack } from '@astryxdesign/core/HStack';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

const NONE = 'none';

/**
 * Free time of one side: none / "Chi tiết" (DEM days and DET days, two
 * clocks) / "Combined" (one DEM + DET total, one clock), in days
 * (calendar days, the start day = day 1). Used by the shipment drawer and
 * "Cập nhật lịch tàu".
 * @param {{
 *   label: string,
 *   description: string,
 *   value: import('../types/index.js').FreeTimeFormValues,
 *   onChange: (value: import('../types/index.js').FreeTimeFormValues) => void,
 *   statuses?: Partial<Record<'demDays' | 'detDays' | 'combinedDays', { type: 'error', message: string } | undefined>>,
 *   isDisabled?: boolean,
 * }} props
 */
export function ShipmentFreeTimeFields({
  label,
  description,
  value,
  onChange,
  statuses = {},
  isDisabled = false,
}) {
  /**
   * @template {keyof import('../types/index.js').FreeTimeFormValues} K
   * @param {K} field
   * @param {import('../types/index.js').FreeTimeFormValues[K]} fieldValue
   */
  function set(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <VStack gap={2} hAlign="stretch">
      <VStack gap={0.5}>
        <Text size="sm" weight="semibold">
          {label}
        </Text>
        <Text size="sm" color="meta-subtle">
          {description}
        </Text>
      </VStack>
      <SegmentedControl
        label={label}
        layout="fill"
        value={value.mode || NONE}
        onChange={(mode) =>
          set(
            'mode',
            mode === NONE
              ? ''
              : /** @type {import('../types/index.js').FreeTimeMode} */ (mode),
          )
        }
        isDisabled={isDisabled}
      >
        <SegmentedControlItem value={NONE} label="Chưa có" />
        <SegmentedControlItem value="Separate" label="Chi tiết" />
        <SegmentedControlItem value="Combined" label="Combined" />
      </SegmentedControl>
      {value.mode === 'Separate' ? (
        <HStack gap={2} vAlign="start" wrap="nowrap">
          <StackItem size="fill">
            <FormattedNumberTextInput
              label="DEM"
              value={value.demDays}
              onChange={(days) => set('demDays', days)}
              units="ngày"
              placeholder="0"
              isRequired
              isDisabled={isDisabled}
              status={statuses.demDays}
            />
          </StackItem>
          <StackItem size="fill">
            <FormattedNumberTextInput
              label="DET"
              value={value.detDays}
              onChange={(days) => set('detDays', days)}
              units="ngày"
              placeholder="0"
              isRequired
              isDisabled={isDisabled}
              status={statuses.detDays}
            />
          </StackItem>
        </HStack>
      ) : null}
      {value.mode === 'Combined' ? (
        <FormattedNumberTextInput
          label="Combined (DEM + DET)"
          value={value.combinedDays}
          onChange={(days) => set('combinedDays', days)}
          units="ngày"
          placeholder="0"
          isRequired
          isDisabled={isDisabled}
          status={statuses.combinedDays}
        />
      ) : null}
    </VStack>
  );
}
